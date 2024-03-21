import { Orders } from './environment/orders.js';
import { getInput, channels } from './environment/nn-input.js';
import { Phase } from './environment/warhammer.js';
import { getStateTensor } from '../utils/get-state-tensor.js';
import { Game } from './game-controller/game-controller.js';
import { getDeployOrders } from './environment/deploy.js'
import { roster2settings } from './utils/roster2settings.js';
import { Mission } from './environment/mission.js';

import battlefields from '../settings/battlefields.json' assert { type: 'json' };

const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');
const settingsRestartBtn = document.getElementById('settings-restart');
const shootBtn = document.getElementById('shoot');
const canvas = document.getElementById("canvas")
const viewCheckbox = document.getElementById("view-checkbox");
const orderViewCheckbox = document.getElementById("order-view-checkbox");

const table = document.getElementById("table")
const ordersSection = document.getElementById("orders-section");
const fullOrdersList = document.getElementById("full-orders-list");
const headerInfo = document.getElementById("header-info");
const nextPhaseBtn = document.getElementById("next-phase-button");
const settingsDialog = document.getElementById("settings-dialog");
const closeSettingsDialog = document.getElementById("close-settings-dialog");
const unitsStrip = document.getElementById("units-strip");
const loadRosterInputPlayer1 = document.getElementById("load-roster-player1");
const loadRosterInputPlayer2 = document.getElementById("load-roster-player2");

const battlefieldSelect = document.getElementById("battlefield-select");
const reloadBtn = document.getElementById("game-reload");
const missionSection = document.getElementById("mission-section");
const unitSection = document.getElementById("unit-section");
const diceSection = document.getElementById("dice-section");
const weaponSection = document.getElementById("weapon-section");

viewCheckbox.addEventListener('change', (e) => {
	table.classList.toggle('hidden', !e.target.checked);
	canvas.classList.toggle('hidden', e.target.checked);
});

orderViewCheckbox.addEventListener('change', (e) => {
	fullOrdersList.classList.toggle('hidden', !e.target.checked);
	ordersSection.classList.toggle('hidden', e.target.checked);
})

function updateHeader(state) {

	const phaseName = ['Command', 'Movement', 'Reinforcements', 'Shooting'][state.phase] ?? 'Deploy';
	headerInfo.innerHTML = `Phase: ${phaseName}, Round: ${state.round}, Player turn: ${state.player}, Player0: ${state.players[0].primaryVP}/${state.players[0].secondaryVP}, Player1: ${state.players[1].primaryVP}/${state.players[1].secondaryVP}`;
}

function updateTable(state) {
	const data = getStateTensor([getInput(state)], ...state.battlefield.size, channels).arraySync();
	const fragment = new DocumentFragment();

	for(let row of data[0]) {
		const rowEl = document.createElement('TR');
		for (let cell of row) {
			const cellEl = document.createElement('TD');
			cellEl.innerHTML = cell;
			rowEl.appendChild(cellEl);
		}
		fragment.appendChild(rowEl);
	}
	table.innerHTML = '';
	table.appendChild(fragment);
}

function updateUnitsStrip(state, playerState) {
	unitsStrip.innerHTML = '';
	let unitCounter = 0;
	state.units.forEach((unit, unitId) => {
		const li = document.createElement("LI");
		li.tabIndex = 0;
		li.innerHTML =`${unit.name}`;
		li.classList.add(`player-${unit.playerId}`);
		if (unitId === game.selectedUnit) {
			li.classList.add(`selected`);
		}
		unitsStrip.appendChild(li);
		if (state.player === unit.playerId) {
			const unitId = unitCounter;
			li.addEventListener('click', () => {
				game.selectUnit(unitId);
			});
		} else {
			li.classList.add(`disabled`);
		}
		unitCounter++;
	});
}

function updateSecondaryMission(state) {
	const orders = new Orders().getOrders();
	missionSection.innerHTML = '';
	state.secondaryMissions.forEach((mission, missionIndex) => {
		const li = document.createElement("LI");
		const button = document.createElement("BUTTON");
		li.innerHTML = mission + (mission === Mission.ATamptingTarget ? state.tamptingTarget : '');
		if(state.phase === Phase.Command) {
			button.innerHTML = 'X';
			li.appendChild(button);
			button.addEventListener('click', () => game.orderResolve([orders.discardSecondaryIndex[missionIndex]]));
		}
		missionSection.appendChild(li);
	});
}

const game = new Game(canvas);

function updateUnitSection(selectedUnit) {
	unitSection.innerHTML = '';
	if (selectedUnit === null || selectedUnit === undefined) {
		return;
	}

	unitSection.append(game.gameSettings.units.flat()[selectedUnit].name + '; ');
	
	unitSection.append(JSON.stringify(game.gameSettings.profiles[selectedUnit]) + '; ');
	unitSection.append(game.gameSettings.categories[selectedUnit].join(', ') + '; ');
	unitSection.append(game.gameSettings.rules[selectedUnit].join(', ') + '; ');
	const state = game.env?.getState() ?? game.deploy?.getState();
	const orders = (state.round === -1 || state.phase === Phase.Reinforcements) ? getDeployOrders() : new Orders().getOrders();
	const selected = game.getSelectedModel();
	state.units[selectedUnit].models.forEach((modelId) => {
		const li = document.createElement("LI");
		li.innerHTML =`${modelId} ${state.modelsStamina[modelId]}`;

		if (modelId === selected) {
			li.classList.add(`selected`);
		}

		unitSection.append(li);

		li.addEventListener('click', () => {
			game.orderResolve([orders.selectIndexes[state.players[state.player].models.indexOf(modelId)]]);
		});
	});

}
function updateWeaponSection(state) {
	weaponSection.innerHTML = '';
	const selectedModel = game.getSelectedModel();
	if (selectedModel === null) {
		return;
	}
	const orders = new Orders().getOrders();
	game.gameSettings.rangedWeapons[selectedModel].forEach((weapon, weaponIndex) => {
		const li = document.createElement("LI");
		for(let key in weapon) {
			li.append(`${key}: ${weapon[key]}; `);
		}

		weaponSection.append(li);
		if (state.phase === Phase.Shooting) {
			li.addEventListener('click', () => {
				game.orderResolve([orders.selectWeaponIndex[weaponIndex]])
			});
		}
	});
};

game.onUpdateDice = (diceInfo) => {
	diceSection.innerHTML = JSON.stringify(diceInfo);
}

game.onUpdate = (state, playerState) => {
	updateTable(state);
	updateHeader(state);
	updateUnitsStrip(state, playerState);
	updateSecondaryMission(state);
	updateUnitSection(game.selectedUnit);
	updateWeaponSection(state);
	console.log(playerState);
}

drawBattlefieldOptions();
drawOrders();

startBtn.addEventListener('click', () => game.start());
restartBtn.addEventListener('click', () => game.restart());
shootBtn.addEventListener('click', () => game.orderResolve([new Orders().getOrders().shootIndex]));
reloadBtn.addEventListener('click', () => {
	game.reload();
	settingsDialog.close();
});

function drawOrders() {
	const orders = new Orders().getOrders().all;
	orders.forEach((order, i) => {
		const li = document.createElement("LI");
		li.innerHTML = JSON.stringify(order);
		li.addEventListener('click', () => game.orderResolve([i]));
		fullOrdersList.appendChild(li);
	});
}

function drawBattlefieldOptions() {
	Object.keys(battlefields).forEach((name) => {
		const option = document.createElement('OPTION');
		option.innerHTML = name;
		option.value = name;
		battlefieldSelect.appendChild(option);
	});
}

battlefieldSelect.addEventListener('change', (e) => {
	localStorage.setItem('battlefield-name', battlefieldSelect.selectedOptions[0].value);
});

nextPhaseBtn.addEventListener('click', () => {
	game.orderResolve([new Orders().getOrders().nextPhaseIndex]);
});

document.addEventListener('keydown', (e) => {
	if(e.code === 'Space') {
		e.preventDefault();
		game.orderResolve([new Orders().getOrders().nextPhaseIndex]);
	}
});

settingsRestartBtn.addEventListener('click', () => {
	settingsDialog.showModal();
});

closeSettingsDialog.addEventListener('click', () => {
	settingsDialog.close();
});

function getEntries(file, options) {
	return (new zip.ZipReader(new zip.BlobReader(file))).getEntries(options);
}

loadRosterInputPlayer1.addEventListener('change', async (e) => {
	var file = e.target.files[0];
	if (!file) {
		return;
	}

	const entries = await getEntries(file);
	const data = await entries[0].getData(new zip.TextWriter());
	const settings = roster2settings(xml2js(data, { compact: true }));
	localStorage.setItem('game-settings-player1', JSON.stringify(settings));
});

loadRosterInputPlayer2.addEventListener('change', async (e) => {
	var file = e.target.files[0];
	if (!file) {
		return;
	}

	const entries = await getEntries(file);
	const data = await entries[0].getData(new zip.TextWriter());
	const settings = roster2settings(xml2js(data, { compact: true }));
	localStorage.setItem('game-settings-player2', JSON.stringify(settings));
});

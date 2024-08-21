import {
	getPlayerOrders,
	getDiscardMissionOrder,
	getSelectModelOrder,
	getSelectWeaponOrder,
	shootOrder,
	nextPhaseOrder,
} from './players/player-orders.js';
import { getInput, channels } from './environment/nn-input.js';
import { Phase } from './environment/warhammer.js';
import { getStateTensor } from '../utils/get-state-tensor.js';
import { Game } from './game-controller/game-controller.js';
import { roster2settings } from './utils/roster2settings.js';
import { Mission } from './environment/mission.js';
import avatars from '../settings/avatars.json' assert { type: 'json' };
import gameSettings from './settings/game-settings.json' assert { type: 'json' };
import allBattlefields from './settings/battlefields.json' assert { type: 'json' };

import config from './game.config.json' assert { type: 'json' };


const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');
const settingsRestartBtn = document.getElementById('settings-restart');
const shootBtn = document.getElementById('shoot');
const canvas = document.getElementById("canvas")
const viewCheckbox = document.getElementById("view-checkbox");
const orderViewCheckbox = document.getElementById("order-view-checkbox");

const table = document.getElementById("table");
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
const unitName = document.getElementById("unit-name");
const unitSection = document.getElementById("unit-section");
const unitStatsHeader = document.getElementById("unit-stats-header");
const diceSection = document.getElementById("dice-section");
const weaponSection = document.getElementById("weapon-section");
const shootingQueue = document.getElementById("shooting-queue");

viewCheckbox.addEventListener('change', (e) => {
	table.classList.toggle('hidden', !e.target.checked);
	canvas.classList.toggle('hidden', e.target.checked);
});

orderViewCheckbox.addEventListener('change', (e) => {
	fullOrdersList.classList.toggle('hidden', !e.target.checked);
	ordersSection.classList.toggle('hidden', e.target.checked);
})

function updateHeader(state) {
	let phaseName = ['Command', 'Movement', 'Reinforcements', 'Shooting'][state.phase] ?? 'Deploy';
	if (state.phase === Phase.PreBattle) {
		phaseName = 'PreBattle';
	}
	headerInfo.classList.toggle('player0', state.player === 0);
	headerInfo.classList.toggle('player1', state.player === 1);
	headerInfo.innerHTML = `Phase: ${phaseName}, Round: ${state.round}, Player turn: ${state.player}, Player0: ${state.players[0].primaryVP}/${state.players[0].secondaryVP}, Player1: ${state.players[1].primaryVP}/${state.players[1].secondaryVP}`;
}

function updateTable(state) {
	const data = getStateTensor([getInput(state, { selected: game.getSelectedModel()})], ...state.battlefield.size, channels).arraySync();
	const fragment = new DocumentFragment();
	const nextline = Math.floor(Math.sqrt(data[0][0][0].length));
	for(let row of data[0]) {
		const rowEl = document.createElement('TR');
		for (let cell of row) {
			const cellEl = document.createElement('TD');
			cellEl.innerHTML = cell.map((v, i) => v.toFixed(1) + ((i === nextline) ? '\n' : ',')).join('');
			rowEl.appendChild(cellEl);
			if (cell.some(v => v !== 0)) {
				cellEl.classList.add('info-cell');
			}
		}
		fragment.appendChild(rowEl);
	}
	table.innerHTML = '';
	table.appendChild(fragment);
}

function updateUnitsStrip(state) {
	unitsStrip.innerHTML = '';
	let unitCounter = 0;

	const orders = game.started ? game.orders : game.deployOrders;
	state.units.forEach((unit, unitId) => {
		
		const li = document.createElement("LI");
		li.tabIndex = 0;
		li.innerHTML =`${unit.name}`;
		li.classList.add(`player-${unit.playerId}`);
		if (unitId === game.selectedUnit) {
			li.classList.add(`selected`);
		}
		unitsStrip.appendChild(li);
		if (avatars[unit.name] !== undefined) {
			const img = document.createElement("img");
			const [name, ext] = avatars[unit.name].split('.')
			img.src = `${name} full.${ext}`;
			li.appendChild(img);
		}
		if (state.player === unit.playerId) {
			const unitId = unitCounter;
			li.addEventListener('click', () => {
				if (unitId !== game.selectedUnit) {
					game.selectUnit(unitId);
					game.orderResolve([getSelectModelOrder(game.gameSettings.units.flat()[unitId].models[0])]);
				}
			});
		} else {
			li.classList.add(`disabled`);
		}
		unitCounter++;
	});
}

function updateSecondaryMission(state) {
	missionSection.innerHTML = '';
	state.secondaryMissions.forEach((missions, playerId) => {
		missionSection.append(`Player: ${playerId}`);
		missions.forEach((mission, missionIndex) => {
			const li = document.createElement("LI");
			const button = document.createElement("BUTTON");
			li.innerHTML = mission;
			if(state.phase === Phase.Command && state.player === playerId) {
				button.innerHTML = 'X';
				li.appendChild(button);
				button.addEventListener('click', () => game.orderResolve([getDiscardMissionOrder(missionIndex)]));
			}
			missionSection.appendChild(li);
		});
	});
}

const game = new Game(canvas);

function updateUnitSection(selectedUnit) {
	unitName.innerHTML = '';
	unitSection.innerHTML = '';
	const haveSelectedUnit = selectedUnit === null || selectedUnit === undefined;

	unitStatsHeader.classList.toggle('hidden', haveSelectedUnit)
	if (haveSelectedUnit) {
		return;
	}

	unitName.append(game.gameSettings.units.flat()[selectedUnit].name);


	const unitProfilesFiels = ['M', 'T', 'SV', 'W', 'LD', 'OC'];

	const state = game.env?.getState() ?? game.deploy?.getState();
	const selected = state.players[state.player].models[game.getSelectedModel()];

	state.units[selectedUnit].models.forEach((modelId) => {
		const modelStats = document.createElement("div");
		modelStats.classList.add('model-stats');

		const stats = document.createElement('div');
		stats.classList.add('stats');
		for (let key of unitProfilesFiels) {
			const cell = document.createElement('div');
			cell.append(game.gameSettings.modelProfiles[modelId][key]);
			stats.append(cell);
		}

		modelStats.append(stats);

		modelStats.append(`${modelId} ${game.gameSettings.modelNames[modelId]} ${state.modelsWounds[modelId]} ${state.modelsStamina[modelId]} `);
		
		if (modelId === selected) {
			modelStats.classList.add(`selected`);
		}

		unitSection.append(modelStats);

		modelStats.addEventListener('click', () => {
			game.orderResolve([getSelectModelOrder(state.players[state.player].models.indexOf(modelId))]);
		});
	});

	unitSection.append(game.gameSettings.categories[selectedUnit].join(', ') + '; ');
	unitSection.append(game.gameSettings.rules[selectedUnit].join(', ') + '; ');

}
function updateWeaponSection(state) {
	weaponSection.innerHTML = '';
	const selectedModel = state.players[state.player].models[game.getSelectedModel()];
	if (selectedModel === null || selectedModel === undefined) {
		return;
	}
	const tr = document.createElement("tr");
	const weaponFields = ['name', 'Keywords', 'Range', 'A', 'BS/WS', 'S', 'AP', 'D']
	for(let key of  weaponFields) {
		if (key === 'name') {
			key = 'weapon name';
		}
		if (key === 'Keywords') {
			key = '';
		}
		const th = document.createElement("th");
		th.append(key);
		tr.append(th);
	}

	weaponSection.append(tr);
	game.gameSettings.rangedWeapons[selectedModel]?.forEach((weapon, weaponIndex) => {
		const tr = document.createElement("tr");
		for(let key of weaponFields) {
			if (key === 'BS/WS') {
				key = 'BS';
			}
			const td = document.createElement("td");
			td.append(weapon[key] ?? '-');
			tr.append(td);
		}

		weaponSection.append(tr);
		if (state.phase === Phase.Shooting) {
			li.addEventListener('click', () => {
				game.orderResolve([getSelectWeaponOrder(weaponIndex)]);
			});
		}
	});
	game.gameSettings.meleeWeapons[selectedModel]?.forEach((weapon) => {
		const tr = document.createElement("tr");
		for(let key of weaponFields) {
			if (key === 'BS/WS') {
				key = 'WS';
			}
			const td = document.createElement("td");
			td.append(weapon[key] ?? '-');
			tr.append(td);
		}

		weaponSection.append(tr);
	});

};

game.onUpdateDice = (diceInfo) => {
	diceSection.innerHTML = JSON.stringify(diceInfo);
}

game.onUpdate = (state) => {
	updateTable(state);
	updateHeader(state);
	updateUnitsStrip(state);
	updateSecondaryMission(state);
	updateUnitSection(game.selectedUnit);
	updateWeaponSection(state);
	updateShootingQueue(state);
}

function updateShootingQueue(state) {
	shootingQueue.innerHTML = '';
	if (game.started) {
		shootingQueue.append(JSON.stringify(game.agents[state.player]._shootingQueue ?? []));
		shootingQueue.append(JSON.stringify(game.agents[state.player]._shootingTargeting ?? []));
	}
}

drawBattlefieldOptions();
drawOrders();

startBtn.addEventListener('click', () => game.start());
restartBtn.addEventListener('click', () => game.restart());
shootBtn.addEventListener('click', () => game.orderResolve([shootOrder]));
reloadBtn.addEventListener('click', () => {
	game.reload();
	settingsDialog.close();
});

function drawOrders() {
	getPlayerOrders().forEach((order, i) => {
		const li = document.createElement("LI");
		li.innerHTML = JSON.stringify(order);
		li.addEventListener('click', () => game.orderResolve([i]));
		fullOrdersList.appendChild(li);
	});
}

function drawBattlefieldOptions() {
	Object.keys(allBattlefields).forEach((name) => {
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
	game.orderResolve([nextPhaseOrder]);
});

document.addEventListener('keydown', (e) => {
	if(e.code === 'Space') {
		e.preventDefault();
		game.orderResolve([nextPhaseOrder]);
	}

	if(e.code === 'Tab') {
		e.preventDefault();
		game.selectNextModel();
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

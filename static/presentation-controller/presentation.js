import {
	getPlayerOrders,
	getDiscardMissionOrder,
	getSetDiceSequenceOrder,
	getSelectModelOrder,
	getSelectWeaponOrder,
	shootOrder,
	nextPhaseOrder,
} from '../players/player-orders.js';
import { getInput, channels } from '../environment/nn-input.js';
import { Phase } from '../environment/warhammer.js';
import { getStateTensor } from '../utils/get-state-tensor.js';
import { Game } from './presentation-controller.js';
import { roster2settings } from '../utils/roster2settings.js';
import { Mission } from '../environment/mission.js';
import { DiceTray } from '../players/dice.js';
import avatars from '../settings/avatars.json' assert { type: 'json' };
import gameSettings from '../settings/game-settings.json' assert { type: 'json' };
import allBattlefields from './battlefields.json' assert { type: 'json' };

import config from '../game.config.json' assert { type: 'json' };


const startBtn = document.getElementById('start');
const settingsRestartBtn = document.getElementById('settings-restart');
const shootBtn = document.getElementById('shoot');
const canvas = document.getElementById("canvas")

const ordersSection = document.getElementById("orders-section");
const fullOrdersList = document.getElementById("full-orders-list");
const headerInfo = document.getElementById("header-info");
const settingsDialog = document.getElementById("settings-dialog");
const closeSettingsDialog = document.getElementById("close-settings-dialog");
const unitsStrip = document.getElementById("units-strip");
const loadRosterInputPlayer1 = document.getElementById("load-roster-player1");
const loadRosterInputPlayer2 = document.getElementById("load-roster-player2");

const battlefieldSelect = document.getElementById("battlefield-select");
const missionSection = document.getElementById("mission-section");
const unitName = document.getElementById("unit-name");
const unitSection = document.getElementById("unit-section");
const unitStatsHeader = document.getElementById("unit-stats-header");
const diceHistorySection = document.getElementById("dice-history-section");
const diceTrayElement = document.getElementById("dice-tray");
const weaponSection = document.getElementById("weapon-section");



function updateHeader(state) {
	let phaseName = ['Command', 'Movement', 'Reinforcements', 'Shooting'][state.phase] ?? 'Deploy';
	if (state.phase === Phase.PreBattle) {
		phaseName = 'PreBattle';
	}
	headerInfo.classList.toggle('player0', state.player === 0);
	headerInfo.classList.toggle('player1', state.player === 1);
	headerInfo.innerHTML = `Round: ${state.round}, Phase: ${phaseName}`;
}


function updateUnitsStrip(state) {
	unitsStrip.innerHTML = '';
	let unitCounter = 0;

	const orders = game.started ? game.orders : game.deployOrders;
	state.units.forEach((unit, unitId) => {
		const li = document.createElement("LI");
		li.tabIndex = 0;
		li.innerHTML = unit.name;
		li.title = unit.name;
		li.classList.add(`player-${unit.playerId}`);
		if (unitId === game.selectedUnit) {
			li.classList.add(`selected`);
		}
		unitsStrip.appendChild(li);
		if (avatars[unit.name] !== undefined) {
			const img = document.createElement("img");
			img.src = `image/${avatars[unit.name]}`;
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
		const playerBlock = document.createElement("div");
		playerBlock.append(`Player${playerId}: ${state.players[playerId].primaryVP}`);
		missionSection.append(playerBlock);
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


	const modelProfilesFiels = ['M', 'T', 'SV', 'W', 'LD', 'OC'];

	const state = game.env?.getState() ?? game.deploy?.getState();
	const selected = state.players[state.player].models[game.getSelectedModel()];

	state.units[selectedUnit].models.forEach((modelId) => {
		const modelStats = document.createElement("div");
		modelStats.classList.add('model-stats');

		const stats = document.createElement('div');
		stats.classList.add('stats');
		for (let key of modelProfilesFiels) {
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

	const selectedModel = state.players[state.player].models[game.getSelectedModel()];
	if (selectedModel !== null && selectedModel !== undefined) {
		unitSection.append(game.gameSettings.rules[selectedModel].join(', ') + '; ');
		unitSection.append(game.gameSettings.abilities[selectedModel].join(', ') + '; ');
	}
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
			tr.addEventListener('click', () => {
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

game.onUpdateDiceHistory = (diceInfo) => {
	const titles = ['attacks', 'hits', 'wounds', 'saves', 'damages'];
	const separator = document.createElement('div');
	separator.classList.add('dice-separator');
	diceHistorySection.insertBefore(separator, diceHistorySection.firstChild);

	[diceInfo.attacks, diceInfo.hits, diceInfo.wounds, diceInfo.saves, diceInfo.damages].forEach((dices, i) => {
		if (dices.length > 0) {
			const diceTrayLine = document.createElement('div');
			diceTrayLine.classList.add('dice-tray-line')
			dices.forEach(value => {
				const dice = document.createElement('div');
				diceTrayLine.append(dice);
				dice.classList.add(`dice`);
				dice.classList.add(`dice-${value}`);
			});
			const titleElement = document.createElement('div');
			titleElement.append(titles[i]);
			diceTrayLine.append(titleElement);
			diceHistorySection.insertBefore(diceTrayLine, diceHistorySection.firstChild);
		}
	});
}

game.onUpdate = (state) => {
	updateHeader(state);
	updateUnitsStrip(state);
	updateSecondaryMission(state);
	updateUnitSection(game.selectedUnit);
	updateWeaponSection(state);
}

drawBattlefieldOptions();
drawOrders();

const diceTray = new DiceTray();

startBtn.addEventListener('click', () => game.start());

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


function updateDiceTray() {
	diceTrayElement.innerHTML = [];

	diceTray.dices.forEach((value, i) => {
		const dice = document.createElement('div');
		function removeDice() {
			diceTray.remove(i);
			updateDiceTray();
		}
		dice.classList.add(`dice`);
		dice.classList.add(`dice-${value}`);
		diceTrayElement.append(dice);
		dice.addEventListener('click', removeDice);
	});
}

function getEntries(file, options) {
	const fr = new FileReader();
	fr.readAsText(file);
	return new Promise(resolve => fr.onload = (e) => resolve(JSON.parse(e.target.result)));
}
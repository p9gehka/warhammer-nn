import {
	getPlayerOrders,
	getDiscardMissionOrder,
	getSetDiceSequenceOrder,
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
import { DiceTray } from './players/dice.js';
import { getArmyRulesRenderer } from './army-rules/army-rules-renderer.js'
import { updateTable } from './gui/update-table.js';
import { players } from './players/players.js';
import avatars from '../settings/avatars.json' with { type: 'json' };
import gameSettings from './settings/game-settings.json' with { type: 'json' };
import allBattlefields from './settings/battlefields.json' with { type: 'json' };

import config from './game.config.json' with { type: 'json' };


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
const loadRosterInputPlayer0 = document.getElementById("load-roster-player0");
const loadRosterInputPlayer1 = document.getElementById("load-roster-player1");

const battlefieldSelect = document.getElementById("battlefield-select");
const player0TypeSelect = document.getElementById("player0-type-select");
const player1TypeSelect = document.getElementById("player1-type-select");
const reloadBtn = document.getElementById("game-reload");
const missionSection = document.getElementById("mission-section");
const unitName = document.getElementById("unit-name");
const unitSection = document.getElementById("unit-section");
const diceHistorySection = document.getElementById("dice-history-section");
const rollDice = document.getElementById("roll-dice");
const diceTrayElement = document.getElementById("dice-tray");
const weaponSection = document.getElementById("weapon-section");
const shootingQueue = document.getElementById("shooting-queue");
const armyRuleSection = document.getElementById("army-rule-section");

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
		playerBlock.append(`Player${playerId}: ${state.players[playerId].primaryVP}/${state.players[playerId].secondaryVP}`);
		missions.forEach((mission, missionIndex) => {
			const missionEl = document.createElement("div");
			const button = document.createElement("button");
			missionEl.innerHTML = mission;
			if(state.phase === Phase.Command && state.player === playerId) {
				button.innerHTML = 'X';
				missionEl.append(button);
				button.addEventListener('click', () => game.orderResolve([getDiscardMissionOrder(missionIndex)]));
			}
			playerBlock.append(missionEl);
		});
		missionSection.append(playerBlock);
	});
}

const game = new Game(canvas);

function updateUnitSection(selectedUnit) {
	unitName.innerHTML = '';
	unitSection.innerHTML = '';
	const haveSelectedUnit = selectedUnit === null || selectedUnit === undefined;

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

		const stats = modelProfilesFiels.map(key => game.gameSettings.modelProfiles[modelId][key]);
		// stats.classList.add('stats');

		modelStats.title = stats.join(' ');

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

game.onUpdateDiceHistory = (diceInfo, name) => {
	const titlesTexts = ['Damages','Saves', 'Wounds', 'Hits', 'Attacks'];
	const titles = ['❤', '♜', '🎯', '🏹', '⚔' ];
	const playerId = game.getCurrentPlayer().playerId;
	[diceInfo.damages, diceInfo.saves, diceInfo.wounds, diceInfo.hits, diceInfo.attacks].forEach((dices, i) => {
		if (dices.length > 0) {
			const diceTrayLine = document.createElement('div');
			const titleElement = document.createElement('div');
			diceTrayLine.title = titlesTexts[i];
			diceTrayLine.classList.add('dice-tray-line')
			diceTrayLine.classList.add(`player-${playerId}`)
			if (dices === diceInfo.saves) {
				diceTrayLine.classList.add('opponent-roll')
			}
			titleElement.append(titles[i]);
			diceTrayLine.append(titleElement);
			dices.forEach(value => {
				const dice = document.createElement('div');
				diceTrayLine.append(dice);
				dice.classList.add(`dice`);
				dice.classList.add(`dice-${value}`);
			});
			diceHistorySection.insertBefore(diceTrayLine, diceHistorySection.firstChild);
		}
	});
	const line = document.createElement('div');
	line.classList.add('line');
	const separator = document.createElement('div');
	separator.classList.add('dice-separator');
	separator.classList.add(`player-${playerId}`);
	separator.append(name);
	separator.append(line);
	diceHistorySection.insertBefore(separator, diceHistorySection.firstChild);
}

game.onUpdate = (state) => {
	updateTable(state.battlefield.size, getInput(state, { selected: game.getSelectedModel()}), table);
	updateHeader(state);
	updateUnitsStrip(state);
	updateSecondaryMission(state);
	updateUnitSection(game.selectedUnit);
	updateWeaponSection(state);
	updateShootingQueue(state);
	updateArmyRuleSection(state);
}

function updateArmyRuleSection(state) {
	getArmyRulesRenderer(game.getCurrentPlayer().armyRule).render(armyRuleSection);
}

function updateShootingQueue(state) {
	shootingQueue.innerHTML = '';
	if (game.started) {
		game.agents[state.player]._shootingQueue?.forEach((weaponName) => {
			let queueLine = document.createElement('div');
			queueLine.append(`${weaponName}: ${JSON.stringify(game.agents[state.player]._shootingTargeting[weaponName])}`);
			shootingQueue.append(queueLine);
		})
	}
}

drawBattlefieldOptions();
drawPlayerTypeOptions();
drawOrders();

const diceTray = new DiceTray();

startBtn.addEventListener('click', () => game.start());
restartBtn.addEventListener('click', () => game.restart());
shootBtn.addEventListener('click', () => {
	game.orderResolve([getSetDiceSequenceOrder(diceTray.dices), shootOrder]);
	diceTray.clear();
	updateDiceTray()
});
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

function drawPlayerTypeOptions() {
	Object.values(players).forEach(player => {
		const option = document.createElement('OPTION');
		option.innerHTML = player.name;
		option.value = player.name;
		player0TypeSelect.appendChild(option);
		player1TypeSelect.appendChild(option.cloneNode(true));
	});
}

player0TypeSelect.value = game.player0Type;
player1TypeSelect.value = game.player1Type;
player0TypeSelect.addEventListener(
	'change', () => localStorage.setItem('player0Type', player0TypeSelect.selectedOptions[0].value)
);
player1TypeSelect.addEventListener(
	'change', () => localStorage.setItem('player1Type', player1TypeSelect.selectedOptions[0].value)
);
battlefieldSelect.addEventListener(
	'change', () => localStorage.setItem('battlefield-name', battlefieldSelect.selectedOptions[0].value)
);

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
		game.selectNextModelAtUnit();
	}
});

settingsRestartBtn.addEventListener('click', () => {
	settingsDialog.showModal();
});

closeSettingsDialog.addEventListener('click', () => {
	settingsDialog.close();
});


rollDice.addEventListener('click', () => {
	diceTray.roll();
	updateDiceTray();
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

loadRosterInputPlayer0.addEventListener('change', async (e) => {
	var file = e.target.files[0];
	if (!file) {
		return;
	}

	const entries = await getEntries(file);
	const settings = roster2settings(entries);
	localStorage.setItem('game-settings-player1', JSON.stringify(settings));
});

loadRosterInputPlayer1.addEventListener('change', async (e) => {
	var file = e.target.files[0];
	if (!file) {
		return;
	}

	const entries = await getEntries(file);
	const settings = roster2settings(entries);
	localStorage.setItem('game-settings-player2', JSON.stringify(settings));
});

window.game = game;

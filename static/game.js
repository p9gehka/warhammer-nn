import { Orders } from './environment/orders.js';
import { getInput, channels } from './environment/nn-input.js';
import { getStateTensor } from '../utils/get-state-tensor.js';
import { Game } from './game-controller/game-controller.js';
import { getDeployOrders } from './environment/deploy.js'
import { roster2settings } from './utils/roster2settings.js';
import * as zip from "https://deno.land/x/zipjs/index.js";

const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');
const settingsRestartBtn = document.getElementById('settings-restart');
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
const loadRosterInput = document.getElementById("load-roster");

viewCheckbox.addEventListener('change', (e) => {
	table.classList.toggle('hidden', !e.target.checked);
	canvas.classList.toggle('hidden', e.target.checked);
})

orderViewCheckbox.addEventListener('change', (e) => {
	fullOrdersList.classList.toggle('hidden', !e.target.checked);
	ordersSection.classList.toggle('hidden', e.target.checked);
})

function updateHeader(state) {
	headerInfo.innerHTML = `Round: ${state.round}, Player turn: ${state.player}, Player0: ${state.players[0].vp}, Player1: ${state.players[1].vp}`;
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
		fragment.appendChild(rowEl)
	}
	table.innerHTML = '';
	table.appendChild(fragment);
}

function updateUnitsStrip(state) {
	unitsStrip.innerHTML = '';
	const deployOrders = state.round === -1 ? getDeployOrders() : new Orders().getOrders();
	state.players.forEach((player) => {
		let modelCounter = 0;
		player.units.forEach((unit) => {
			const li = document.createElement("LI");
			li.tabIndex = 0;
			li.innerHTML =`${unit.playerId} ${unit.name} ${state.modelsStamina[unit.models[0]]}`;
			li.classList.add(`player-${unit.playerId}`)
			unitsStrip.appendChild(li);
			if (state.player === unit.playerId) {
				const playerModelId = modelCounter;
				li.addEventListener('click', () => game.orderResolve([deployOrders.selectIndexes[playerModelId]]));
			} else {
				li.classList.add(`disabled`);
			}
			modelCounter++;
		});
	})
}

const game = new Game(canvas);
game.onUpdate = (state) => {
	updateTable(state);
	updateHeader(state);
	updateUnitsStrip(state);
}

drawOrders();

startBtn.addEventListener('click', () => game.start());
restartBtn.addEventListener('click', () => game.restart());
function drawOrders() {
	const orders = new Orders().getOrders().all;
	orders.forEach((order, i) => {
		const li = document.createElement("LI");
		li.innerHTML = JSON.stringify(order);
		li.addEventListener('click', () => game.orderResolve([i]));
		fullOrdersList.appendChild(li);
	});
}

nextPhaseBtn.addEventListener('click', () => {
	game.orderResolve([new Orders().getOrders().nextPhaseIndex]);
});

settingsRestartBtn.addEventListener('click', () => {
	settingsDialog.showModal();
});

closeSettingsDialog.addEventListener('click', () => {
	settingsDialog.close();
})

function getEntries(file, options) {
	return (new zip.ZipReader(new zip.BlobReader(file))).getEntries(options);
}

loadRosterInput.addEventListener('change', async (e) => {
	var file = e.target.files[0];
	if (!file) {
	  return;
	}

	const entries = await getEntries(file);
	const data = await entries[0].getData(new zip.TextWriter())
	const settings = roster2settings(xml2js(data, {compact: true}))
	localStorage.setItem('game-settings', JSON.stringify(settings));
});

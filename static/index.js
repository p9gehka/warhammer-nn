import { Battlefield, Scene } from './drawing-entities/drawing-entities.js';
import { playerOrders } from './players/player-orders.js';
import { getInput, channels } from '../environment/nn-input.js';
import { getStateTensor } from '../utils/get-state-tensor.js';

const startBtn = document.getElementById('start');
const canvas = document.getElementById("canvas")
const historyList = document.getElementById("history-list");
const ordersList = document.getElementById("orders-list");
const unitsStrip = document.getElementById("units-strip");
const viewCheckbox = document.getElementById("view-checkbox");
const table = document.getElementById("table");
const ctx = canvas.getContext("2d");
const vpPlayer1Element = document.getElementById('player-1-vp');
const vpPlayer2Element = document.getElementById('player-2-vp');

ctx.scale(canvas.width / 60, canvas.height / 44);

const model = await tf.loadLayersModel(`/agents/move-agent/.model44x30x4/model.json`);
const battlefield = new Battlefield(ctx, { size: [0, 0], objective_marker: [], ruins: [] });
await battlefield.init();
battlefield.draw();

let actionAndStates = [];
let scene = null;

async function start () {
	historyList.innerHTML = '';
	const response = await fetch('/play', {
		method: 'POST',
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({}),
	});

	actionAndStates = await response.json();
	const [initState] = actionAndStates[0];

	scene = new Scene(ctx, initState);
	await scene.init();

	let lastRound = 1;
	let prevPlayer = 'player-0';
	actionAndStates.forEach(([prevState, playerState, order, state, nnInfo, reward], i) => {
		const li = document.createElement("LI");
		li.classList.add(prevPlayer);
		prevPlayer = state.player === 0 ? 'player-0': 'player-1';
		li.dataset.indexNumber = i;
		li.innerHTML = [JSON.stringify(order), (nnInfo?.estimate ?? 'N/A'), reward].join();
		li.tabIndex = 0;
		historyList.appendChild(li);
		let round = Math.floor(state.turn / 2);
		if (lastRound !== round) {
			const separator = document.createElement("LI");
			separator.innerHTML = `round ${round + 1} Player1: ${state.players[0].vp} Player2: ${ state.players[1].vp}`;
			lastRound = round;
			historyList.appendChild(separator);
		}
	});
}

function setState(e) {
	if (e.target.dataset.indexNumber) {
		const [prevState, playerState, order, state] = actionAndStates[e.target.dataset.indexNumber];
		scene.updateState(state);
		scene.drawOrder(order);
		const input = getInput(prevState, playerState);
		updatePredictions(prevState, input);
		updateTable(prevState, input);
		updateUnitsStrip(state);
	}
}

async function updatePredictions(state, input) {
	ordersList.innerHTML = '';
	const orders = playerOrders;

	const [_, height, width] = model.input.shape;
	window.tf.tidy(() => {
		const predictions = model.predict(getStateTensor([input], width, height, channels)).dataSync();
		orders.forEach((order, i) => {
			const li = document.createElement("LI");
			li.innerHTML = [JSON.stringify(order), predictions[i].toFixed(3)].join();
			ordersList.appendChild(li);
		});
	});
}

startBtn.addEventListener('click', start);
historyList.addEventListener('click', setState);
historyList.addEventListener('focus', setState, true);
historyList.addEventListener('keydown', (e) => {
	if (e.key === 'Tab') {
		const focusableItems = historyList.querySelectorAll('li[tabindex="0"]');
		const firstFocusable = focusableItems[0];
		const lastFocusable = focusableItems[focusableItems.length - 1];
		if (e.shiftKey && e.target === firstFocusable) {
			e.preventDefault();
			lastFocusable.focus();
		} else if (!e.shiftKey && e.target === lastFocusable) {
			e.preventDefault();
			firstFocusable.focus();
		}
	}
});

function updateUnitsStrip(state) {
	unitsStrip.innerHTML = '';
	state.players.forEach((player) => {
		let modelCounter = 0;
		player.units.forEach((unit) => {
			const li = document.createElement("LI");
			li.tabIndex = 0;
			li.innerHTML =`${unit.name} ${state.modelsStamina[unit.models[0]]}`;
			li.classList.add(`player-${unit.playerId}`);
			unitsStrip.appendChild(li);
		});
	})
}

viewCheckbox.addEventListener('change', (e) => {
	table.classList.toggle('hidden', !e.target.checked);
	canvas.classList.toggle('hidden', e.target.checked);
});

function updateTable(state, input) {
	const data = getStateTensor([input], ...state.battlefield.size, channels).arraySync();
	const fragment = new DocumentFragment();
	const nextline = Math.floor(Math.sqrt(data[0][0][0].length)) - 1;
	for(let row of data[0]) {
		const rowEl = document.createElement('TR');
		for (let cell of row) {
			const cellEl = document.createElement('TD');
			cellEl.innerHTML = cell.map((v, i) => v.toFixed(1) + ((i === nextline) ? '\n' : ',')).join('');
			rowEl.appendChild(cellEl);
			if (cell[0] !== 0) {
				cellEl.classList.add('model-cell');
			} else if (cell.some(v => v !== 0)) {
				cellEl.classList.add('info-cell');
			}
		}
		fragment.appendChild(rowEl)
	}
	table.innerHTML = '';
	table.appendChild(fragment);
}

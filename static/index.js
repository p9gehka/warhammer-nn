import { Battlefield, Scene } from './drawing-entities/drawing-entities.js';
import { Orders } from './environment/orders.js';
import { getInput, channels } from '../environment/nn-input.js';
import { getStateTensor } from '../utils/get-state-tensor.js';

const startBtn = document.getElementById('start');
const canvas = document.getElementById("canvas")
const historyList = document.getElementById("history-list");
const ordersList = document.getElementById("orders-list");
const unitsStrip = document.getElementById("units-strip");
const ctx = canvas.getContext("2d");
const vpPlayer1Element = document.getElementById('player-1-vp');
const vpPlayer2Element = document.getElementById('player-2-vp');

ctx.scale(canvas.width / 60, canvas.height / 44);

const [width, height] = [60, 44];
const model = await tf.loadLayersModel(`/models/dqn/temp/model.json`);
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
	actionAndStates.forEach(([prevState, order, state, reward, nnInfo], i) => {
		const li = document.createElement("LI");
		li.classList.add(prevPlayer);
		prevPlayer = state.player === 0 ? 'player-0': 'player-1';
		li.dataset.indexNumber = i;
		li.innerHTML = [JSON.stringify(order), reward, (nnInfo?.estimate ?? 'N/A')].join();
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
		const [prevState, order, state] = actionAndStates[e.target.dataset.indexNumber];
		scene.updateState(state);
		scene.drawOrder(order);
		updatePredictions(prevState);
		updateUnitsStrip(state);
	}
}

async function updatePredictions(state) {
	ordersList.innerHTML = '';
	const orders = new Orders().getOrders().all;

	const [_, height, width] = model.input.shape;
	window.tf.tidy(() => {
		const predictions = model.predict(getStateTensor([getInput(state)], width, height, channels)).dataSync();
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

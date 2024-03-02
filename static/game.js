import { Orders } from './environment/orders.js';
import { getInput, channels } from './environment/nn-input.js';
import { getStateTensor } from '../utils/get-state-tensor.js';
import { Game } from './game-controller/game-controller.js';

const restartBtn = document.getElementById('restart');
const canvas = document.getElementById("canvas")
const viewCheckbox = document.getElementById("view-checkbox");
const orderViewCheckbox = document.getElementById("order-view-checkbox");

const table = document.getElementById("table")
const ordersSection = document.getElementById("orders-section");
const fullOrdersList = document.getElementById("full-orders-list");
const headerInfo = document.getElementById("header-info");
const nextPhaseBtn = document.getElementById("next-phase-button");



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

const game = new Game(canvas);
game.onUpdate = (state) => {
	updateTable(state);
	updateHeader(state)
}

drawOrders();

restartBtn.addEventListener('click', () => game.restart());
function drawOrders() {
	const orders = new Orders().getOrders().all;
	orders.forEach((order, i) => {
		const li = document.createElement("LI");
		li.innerHTML = JSON.stringify(order);
		li.addEventListener('click', () => game.orderResolve(i))
		fullOrdersList.appendChild(li);
	});
}

nextPhaseBtn.addEventListener('click', () => {
	game.orderResolve(new Orders().getOrders().nextPhaseIndex);
});

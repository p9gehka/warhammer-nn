import { Battlefield, Scene } from './drawing-entities/drawing-entities.js';
import { Warhammer } from './environment/warhammer.js'
import { Orders } from './environment/orders.js';
import { PlayerEnvironment } from './environment/player-environment.js'
import { RandomAgent } from './agents/random-agent0.1.js';
import { ControlledAgent } from './agents/controlled-agent.js';
import { getStateTensor } from '../utils/get-state-tensor.js';
import { getInput, channels } from '../environment/nn-input.js';

const restartBtn = document.getElementById('restart');
const canvas = document.getElementById("canvas")
const viewCheckbox = document.getElementById("view-checkbox");
const table = document.getElementById("table")
const ordersList = document.getElementById("orders-list");
const header = document.getElementById("header");

const ctx = canvas.getContext("2d");

ctx.scale(canvas.width / 60, canvas.height / 44);

const battlefield = new Battlefield(ctx, { size: [0, 0], objective_marker: [], ruins: [] });
await battlefield.init()
battlefield.draw()

let scene = null

drawOrders();
let orderResolve;
let orderPromise = new Promise((resolve) => { orderResolve = resolve });

let env = [];
let players = [];
let agents = [];

async function start() {
	env = new Warhammer();

	scene = new Scene(ctx, env.getState());
	await scene.init();
	players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	agents = [new ControlledAgent(players[0]), new ControlledAgent(players[1])];
	play();
}

function restart() {
	agents.forEach(agent => agent.reset());
	env.reset();
	play();
}

async function play() {
	while(true) {
		const state = env.getState();
		scene.updateState(state);
		updateTable(state);
		updateHeader(state)
		console.log('CumulativeReward', players.map(p => p.cumulativeReward))
		if (state.done) {
			agents.forEach(agent => agent.awarding());
			console.log('CumulativeReward awarding', players.map(p => p.cumulativeReward));
			break;
		} else {
			const order = await orderPromise;
			orderPromise = new Promise((resolve) => { orderResolve = resolve });
			agents[state.player].playStep(order)
		}
	}
}

function updateHeader(state) {
	header.innerHTML = `Round: ${state.round}, Player turn: ${state.player}, Player0: ${state.players[0].vp}, Player1: ${state.players[1].vp}`;
}

function drawOrders() {
	const orders = new Orders().getOrders().all;
	orders.forEach((order, i) => {
		const li = document.createElement("LI");
		li.innerHTML = JSON.stringify(order);
		li.addEventListener('click', () => orderResolve(i))
		ordersList.appendChild(li);
	});
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
start();
restartBtn.addEventListener('click', restart);

viewCheckbox.addEventListener('change', (e) => {
	table.classList.toggle('hidden', !e.target.checked);
	canvas.classList.toggle('hidden', e.target.checked);
})

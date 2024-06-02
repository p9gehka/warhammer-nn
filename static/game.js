import { Battlefield, Scene } from './drawing-entities/drawing-entities.js';
import { Warhammer } from './environment/warhammer.js'
import { Orders } from './environment/orders.js';
import { PlayerEnvironment } from './environment/player-environment.js'
import { RandomAgent } from './agents/random-agent0.1.js';
import { ControlledAgent } from './agents/controlled-agent.js';
import { getStateTensor } from '../utils/get-state-tensor.js';
import { getInput, channels } from '../environment/nn-input.js';

import gameSettings from './settings/game-settings.json' assert { type: 'json' };
import battlefields from './settings/battlefields.json' assert { type: 'json' };

const restartBtn = document.getElementById('restart');
const canvas = document.getElementById("canvas");
const viewCheckbox = document.getElementById("view-checkbox");
const table = document.getElementById("table");
const ordersList = document.getElementById("orders-list");
const header = document.getElementById("header");

const ctx = canvas.getContext("2d");

ctx.scale(canvas.width / 60, canvas.height / 44);

const battlefield = new Battlefield(ctx, { size: [0, 0], objective_marker: [], ruins: [] });
await battlefield.init();
battlefield.draw();

let scene = null;

drawOrders();
let orderResolve;
let orderPromise = new Promise((resolve) => { orderResolve = resolve });

let env = [];
let players = [];
let agents = [];

let playPromise = null;
async function start() {
	env = new Warhammer({ gameSettings, battlefields });

	scene = new Scene(ctx, env.getState());
	await scene.init();
	players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	agents = [new ControlledAgent(players[0]), new ControlledAgent(players[1])];
	playPromise = play();
}

async function restart() {
	env.end();
	orderResolve(0);
	await playPromise;
	agents.forEach(agent => agent.reset());
	players.forEach(player => player.reset());
	env.reset();
	playPromise = play();
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
	header.innerHTML = `Round: ${state.round}, Player turn: ${state.player}, Player0: ${state.players[0].primaryVP}, Player1: ${state.players[1].primaryVP}`;
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

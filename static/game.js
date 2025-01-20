import { Battlefield, Scene } from './drawing-entities/drawing-entities.js';
import { Warhammer } from './environment/warhammer.js'
import { playerOrders } from './players/player-orders.js';
import { PlayerControlled } from './players/player-controlled.js';
import { getStateTensor } from './utils/get-state-tensor.js';
import { filterObjByKeys } from './utils/index.js';
import { getInput, channels } from './environment/nn-input.js';

import gameSettings from './settings/game-settings.json' assert { type: 'json' };
import allBattlefields from './settings/battlefields.json' assert { type: 'json' };

import config from './game.config.json' assert { type: 'json' };

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

let battlefields = config.battlefields.length > 0 ? filterObjByKeys(allBattlefields, config.battlefields) : allBattlefields;


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
	players = [new PlayerControlled(0, env), new PlayerControlled(1, env)];
	playPromise = play();
}

async function restart() {
	env.end();
	orderResolve([0]);
	await playPromise;
	players.forEach(player => player.reset());
	env.reset();
	playPromise = play();
}

async function play() {
	while(true) {
		const state = env.getState();
		scene.updateState(state);
		updateTable(state, players[state.player].getState());
		updateHeader(state)
		console.log('CumulativeReward', players.map(p => p.cumulativeReward))
		if (state.done) {
			agents.forEach(agent => agent.awarding());
			console.log('CumulativeReward awarding', players.map(p => p.cumulativeReward));
			break;
		} else {
			players[state.player].orderPromise = orderPromise;
			const [lastAction] = await players[state.player].playStep();
			orderPromise = new Promise((resolve) => { orderResolve = resolve });
		}
	}
}

function updateHeader(state) {
	header.innerHTML = `Round: ${state.round}, Player turn: ${state.player}, Player0: ${state.players[0].primaryVP}, Player1: ${state.players[1].primaryVP}`;
}

function drawOrders() {
	const orders = playerOrders;
	orders.forEach((order, i) => {
		const li = document.createElement("LI");
		li.innerHTML = JSON.stringify(order);
		li.addEventListener('click', () => orderResolve([i]))
		ordersList.appendChild(li);
	});
}

function updateTable(state, playerState) {
	const data = getStateTensor([getInput(state, playerState)], ...state.battlefield.size, channels)[0].arraySync();
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
});

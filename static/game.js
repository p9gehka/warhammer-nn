import { Battlefield, Scene } from './drawing-entities/drawing-entities.js';
import { Warhammer } from './environment/warhammer.js'
import { Orders } from './environment/orders.js';
import { PlayerEnvironment } from './environment/player-environment.js'
import { RandomAgent } from './agents/random-agent0.1.js';
import { ControlledAgent } from './agents/controlled-agent.js';

const startBtn = document.getElementById('start');
const canvas = document.getElementById("canvas")
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

async function start () {
	const env = new Warhammer();

	scene = new Scene(ctx, env.getState());
	await scene.init();
	const players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	let agents = [new ControlledAgent(players[0]), new ControlledAgent(players[1])];
	while(true) {
		const state = env.getState();
		scene.updateState(state);
		updateHeader(state)
		console.log('CumulativeReward', players.map(p => p.cumulativeReward))
		if (state.done) {
			agents.forEach(agent => agent.awarding());
			console.log('CumulativeReward awarding', players.map(p => p.cumulativeReward))
			agents.forEach(agent => agent.reset());
			env.reset();
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

startBtn.addEventListener('click', start);

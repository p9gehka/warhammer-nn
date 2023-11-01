import gameSettings from './settings/game-settings.json' assert { type: 'json' };
import { Battlefield, Scene } from './drawing-entities/drawing-entities.js';

const startBtn = document.getElementById('start');
const canvas = document.getElementById("canvas")
const actionsList = document.getElementById("actions-list");

const ctx = canvas.getContext("2d");
const vpPlayer1Element = document.getElementById('player-1-vp');
const vpPlayer2Element = document.getElementById('player-2-vp');

ctx.scale(canvas.width / gameSettings.battlefield.size[0], canvas.height / gameSettings.battlefield.size[1]);

const battlefield = new Battlefield(ctx, { size: gameSettings.battlefield.size, objective_marker: [], ruins: [] });
battlefield.draw()

let actionAndStates = [];
let scene = null
async function start () {
	const response = await fetch('/play', {
		method: 'POST',
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({})
	});

	actionAndStates = await response.json();
	const [,initState] = actionAndStates[0];

	scene = new Scene(ctx, initState);
	actionsList.innerHTML = '';

	let lastRound = 1;
	actionAndStates.forEach(([order, state], i) => {
		let round = Math.floor(state.turn / 2);
		if (lastRound !== round) {
			const separator = document.createElement("LI");
			separator.innerHTML = `round ${round + 1} Player1: ${state.players[0].vp} Player2: ${ state.players[1].vp}`;
			lastRound = round;
			actionsList.appendChild(separator);
		}
		
		const li = document.createElement("LI");
		li.dataset.indexNumber = i;
		li.innerHTML = JSON.stringify(order);
		li.tabIndex = 0;
		actionsList.appendChild(li);
	});
}

function setState(e) {
	if (e.target.dataset.indexNumber) {
		const [order, state] = actionAndStates[e.target.dataset.indexNumber];
		scene.updateState(state);
		scene.drawOrder(order);
	}
}
startBtn.addEventListener('click', start);
actionsList.addEventListener('click', setState);
actionsList.addEventListener('focus', setState, true);
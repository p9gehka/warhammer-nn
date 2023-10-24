import gameSettings from './settings/game-settings.json' assert { type: 'json' };
import { Battlefield, Scene } from './drawing-entities/drawing-entities.js';

const startBtn = document.getElementById('start');
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d");
const vpPlayer1Element = document.getElementById('player-1-vp');
const vpPlayer2Element = document.getElementById('player-2-vp');

ctx.scale(canvas.width / gameSettings.battlefield.size[0], canvas.height / gameSettings.battlefield.size[1]);

(new Battlefield(ctx).draw());

async function start () {
	const response = await fetch('/reset', {
		method: 'POST',
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({})
	});
	const state = await response.json();
	const scene = new Scene(ctx, state);

	vpPlayer1Element.innerHtml = state.players[0].vp;
	vpPlayer2Element.innerHtml = state.players[1].vp;

	const response2 = await fetch('/step', {
		method: 'POST',
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ id: 0, position: [10, 12]})
	});

	const state2 = await response2.json();
	scene.updateState(state2)
}


startBtn.addEventListener('click', start);
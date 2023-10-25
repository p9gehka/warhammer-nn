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
	const initState = await response.json();
	const scene = new Scene(ctx, initState);

	vpPlayer1Element.innerHtml = initState.players[0].vp;
	vpPlayer2Element.innerHtml = initState.players[1].vp;

	let promise = Promise.resolve();
	const orders = [{action: "MOVE", id: 0, position: [12, 15]}, {action: "MOVE", id: 0, position: [12, 15]}, {action: "NEXT_PHASE"}, {action: "NEXT_PHASE"},{action: "NEXT_PHASE"},{action: "NEXT_PHASE"},{action: "NEXT_PHASE"},{action: "NEXT_PHASE"},{action: "NEXT_PHASE"}].forEach(
		(order) => {
			promise = promise.then(async () => {
				const res = await fetch('/step', {
					method: 'POST',
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(order)
				});
				const st = await res.json();
				vpPlayer1Element.innerHTML = st.players[0].vp;
				vpPlayer2Element.innerHTML = st.players[1].vp;
				scene.updateState(st);
			})
		})
}

startBtn.addEventListener('click', start);
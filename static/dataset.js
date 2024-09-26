import { MoveAgent } from './agents/move-agent/move-center-agent.js';
import { getRawDataset } from './utils/get-dataset.js';
import { Battlefield, Scene } from './drawing-entities/drawing-entities.js';
import { add } from './utils/vec2.js';

const countOrders = new Array(MoveAgent.settings.orders.length).fill(0);
const battlefieldSettings = { size: [MoveAgent.settings.width, MoveAgent.settings.height], objective_marker: [], ruins: [] };

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.scale(canvas.width / 60, canvas.height / 44);

const battlefield = new Battlefield(ctx, battlefieldSettings);
await battlefield.init();
battlefield.draw();

const unitModels = Array(50).fill(0).map((v, i) => i);
const models = Array(50).fill([NaN, NaN]);
const state = { units: [{ models:  unitModels }], battlefield: battlefieldSettings, models: models };
const arrows = []
async function start() {
	const scene = new Scene(ctx, state);
	await scene.init();
	let i = 0;
	await getRawDataset().take(50).forEachAsync(e => {
		models[i] = e[0][0][0];
		if (e[1] !== 0) {
			arrows.push([add(models[i],[0.3, 0.3]), add(add(models[i],[0.3, 0.3]), MoveAgent.settings.orders[e[1]].vector)])
		} else {
			console.log(models[i], e[1])
		}

		countOrders[e[1]]++;
		i++;
	});
	scene.updateState(state, {arrows});
	countOrders.forEach((n, i) => console.log(MoveAgent.settings.orders[i], n))
}

start();

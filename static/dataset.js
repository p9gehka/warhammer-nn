import { MoveAgent } from './agents/move-agent/move-center-agent.js';
import { getRawDataset } from './utils/get-dataset.js';
import { Battlefield, Scene } from './drawing-entities/drawing-entities.js';
import { add } from './utils/vec2.js';
import { getStateTensor } from './utils/get-state-tensor.js';
import { Phase } from './environment/warhammer.js';
import { getInput, channels, Channel1Name } from './environment/nn-input.js';

const countOrders = new Array(MoveAgent.settings.orders.length).fill(0);
const battlefieldSettings = { size: [MoveAgent.settings.width, MoveAgent.settings.height], objective_marker: [], ruins: [], deployment: 'center44x30' };

const viewCheckbox = document.getElementById("view-checkbox");
const canvas = document.getElementById("canvas");
const table = document.getElementById("table");
const ctx = canvas.getContext("2d");
ctx.scale(canvas.width / 60, canvas.height / 44);

const battlefield = new Battlefield(ctx, battlefieldSettings);
await battlefield.init();
battlefield.draw();

const unitModels = Array(100).fill(0).map((v, i) => i);
const models = Array(100).fill([NaN, NaN]);
const modelsStamina = Array(100).fill(0);
const state = {  phase:Phase.Movement,player: 0, players:[{ models: unitModels, playerId: 0 }], units: [{ models: unitModels }], battlefield: battlefieldSettings, models: models, modelsStamina };
const arrows = []
async function start() {
	const scene = new Scene(ctx, state);
	await scene.init();

	let i = 0;
	await getRawDataset().take(100).forEachAsync(e => {
		models[i] = e[0][0][0];
		if (e[1] !== 0) {
			arrows.push([add(models[i],[0.3, 0.3]), add(add(models[i],[0.3, 0.3]), MoveAgent.settings.orders[e[1]].vector)])
		} else {
			console.log(models[i], e[1])
		}
		for (let key of Object.keys(Channel1Name)) {
			if(e[0][key].length > 0) {
				modelsStamina[i] = channels[1][key] * 10;
				break;
			}
		}
		countOrders[e[1]]++;
		i++;
	});
	scene.updateState(state, {arrows});
	updateTable(state);
	countOrders.forEach((n, i) => console.log(MoveAgent.settings.orders[i], n))
}



function updateTable(state) {
	console.log(getInput(state))
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

viewCheckbox.addEventListener('change', (e) => {
	table.classList.toggle('hidden', !e.target.checked);
	canvas.classList.toggle('hidden', e.target.checked);
});

start();

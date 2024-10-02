import { MoveAgent } from './agents/move-agent/move-to-object-agent.js';
import { getRawDataset, gameToFeaturesAndLabel } from './utils/get-dataset.js';
import { Battlefield, Scene } from './drawing-entities/drawing-entities.js';
import { add } from './utils/vec2.js';
import { getStateTensor } from './utils/get-state-tensor.js';
import { Phase, Warhammer } from './environment/warhammer.js';
import { getInput, channels, Channel1Name, Channel3Name  } from './environment/nn-input.js';
import { getRandomInteger } from './utils/index.js';

import allBattlefields from '../settings/battlefields.json' assert { type: 'json' };
import gameSettings from './settings/game-settings.json' assert { type: 'json' };

const battlefieldsNames = Object.keys(allBattlefields);
const battlefieldName = getRandomInteger(0, battlefieldsNames.length);
const battlefieldSettings = allBattlefields[battlefieldsNames[battlefieldName]];

const countOrders = new Array(MoveAgent.settings.orders.length).fill(0);

const viewCheckbox = document.getElementById("view-checkbox");
const canvas = document.getElementById("canvas");
const table = document.getElementById("table");
const ctx = canvas.getContext("2d");
ctx.scale(canvas.width / 60, canvas.height / 44);

const battlefield = new Battlefield(ctx, battlefieldSettings);
await battlefield.init();
battlefield.draw();

const numberOfExamples = 50;
const unitModels = Array(numberOfExamples).fill(0).map((v, i) => i);
const models = Array(numberOfExamples).fill([NaN, NaN]);
const modelsStamina = Array(numberOfExamples).fill(0);
const state = { phase:Phase.Movement,player: 0, players:[{ models: unitModels, playerId: 0 }], units: [{ models: unitModels }], battlefield: battlefieldSettings, models: models, modelsStamina };
let stateTensor = getStateTensor([getInput(state, {selected: 0})], MoveAgent.settings.width, MoveAgent.settings.height, channels).squeeze();
const arrows = [];
const states = [];

async function start() {
	const scene = new Scene(ctx, state);
	const env = new Warhammer({ gameSettings: gameSettings, battlefields: { [battlefieldName]: battlefieldSettings } })
	state.battlefield = env.getState().battlefield;
	await scene.init();

	let i = 0;
	await getRawDataset(env).take(numberOfExamples).forEachAsync(e => {
		states.push(e[0])
		stateTensor = stateTensor.maximum(gameToFeaturesAndLabel(e).xs);
		models[i] = e[0][Channel3Name.Order0][0];
		if (e[1] !== 0) {
			arrows.push([add(models[i],[0.3, 0.3]), add(add(models[i],[0.3, 0.3]), MoveAgent.settings.orders[e[1]].vector)])
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
	const data = stateTensor.arraySync();
	const fragment = new DocumentFragment();
	const nextline = Math.floor(Math.sqrt(data[0][0][0].length));
	for(let row of data) {
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

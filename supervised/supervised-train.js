import * as fs from 'fs';
import shelljs from 'shelljs';
import { getTF } from '../static/utils/get-tf.js';
import { Warhammer } from '../static/environment/warhammer.js';
import { MoveAgent } from '../static/agents/move-agent/move-center-agent.js';
import { getStateTensor } from '../static/utils/get-state-tensor.js';
import { createDeepQNetwork } from '../dqn/dqn.js';
import { getRandomInteger } from '../static/utils/index.js';
import { sendDataToTelegram, sendMessage, memoryUsage } from '../visualization/utils.js';

import gameSettings from '../static/settings/game-settings.json' assert { type: 'json' };
import allBattlefields from '../static/settings/battlefields.json' assert { type: 'json' };

import config from '../config.json' assert { type: 'json' };
const savePath = '../models/supervised-dqn/';

let battlefields = config.battlefields.length > 0 ? filterObjByKeys(allBattlefields, config.battlefields) : allBattlefields;

const tf = await getTF();
const batchSize = 25;
const epochs = 50;

function gameToFeaturesAndLabel(record) {
	return tf.tidy(() => {
		const [input, orderIndex] = record;
		const features = getStateTensor([input], MoveAgent.settings.height, MoveAgent.settings.width, MoveAgent.settings.channels).squeeze();
		const label = tf.oneHot([orderIndex], MoveAgent.settings.orders.length);
		return {xs: features, ys: label};
	});
}

export function getDataset() {
	const env = new Warhammer({ gameSettings, battlefields });
	const agent = new MoveAgent();
	function getStateAndAnswer() {
		const state = env.getState();
		const { orderIndex, order } = agent.playStep(state);		
		const selected = env.players[state.player].models[0];
		env.step({ ...order, id: selected });
		env.reset();
		env.models[selected].stamina = getRandomInteger(0, 8);
		return [agent.getInput(state), agent.playStep(state).orderIndex];
	}
	function* getStateAndAnswerGeneratorFn() {
		while(true) {
			yield getStateAndAnswer();
		}
	}

	const myGeneratorDataset = tf.data.generator(getStateAndAnswerGeneratorFn);
	return myGeneratorDataset.map(gameToFeaturesAndLabel)
		.batch(batchSize);
}
export async function train(nn) {
	const dataset = getDataset();
	const countOrders = new Array(MoveAgent.settings.orders.length).fill(0);
	/*
	console.log(MoveAgent.settings.orders)
	await myGeneratorDataset.take(10000).forEachAsync(e => countOrders[e[1]]++);
	console.log(countOrders)
	*/

	const model = createDeepQNetwork(MoveAgent.settings.orders.length, MoveAgent.settings.width, MoveAgent.settings.height, MoveAgent.settings.channels.length)
	model.add(tf.layers.softmax());
	const opimizer = tf.train.adam(config.learningRate)
	model.compile({
		optimizer: opimizer,
		loss: 'categoricalCrossentropy',
		metrics: ['accuracy'],
	});
	model.summary();
	await trainModelUsingFitDataset(model, dataset);
}

export async function trainModelUsingFitDataset(model, dataset) {
	const trainLogs = [];
	const beginMs = performance.now();
	const lossLogs = [];
	const accuracyLogs = [];

	const fitDatasetArgs = {
		batchesPerEpoch: batchSize,
		epochs: epochs,
		validationData: dataset,
		validationBatches: 10,
		callbacks: {
			onEpochEnd: async (epoch, logs) => {
				lossLogs.push({ epoch, val_loss: logs.val_loss });
				accuracyLogs.push({ epoch, val_acc: logs.val_acc });
				const secPerEpoch =(performance.now() - beginMs) / (1000 * (epoch + 1));
				if (savePath != null) {
					if (!fs.existsSync(savePath)) {
						shelljs.mkdir('-p', savePath);
					}
					//await model.save(`file://${savePath}`);
					//console.log(`Saved DQN to ${savePath}`);
				}
			},
		}
	};
	const result = await model.fitDataset(dataset, fitDatasetArgs);

	await sendConfigMessage(model);
	await sendDataToTelegram(lossLogs);
	await sendDataToTelegram(accuracyLogs);

	return result;
}
async function sendConfigMessage(model) {
	await sendMessage(
		model.layers.map( layer => `${layer.name.split('_')[0]}{${ ['filters', 'kernelSize', 'units', 'rate'].map(filter => layer[filter] ? `filter: ${layer[filter]}` : '').filter(v=>v !=='') }}` ).join('->')
	);
	await sendMessage(
		`Supervised hyperparams Config batchSize:${batchSize} learningRate:${config.learningRate}`
	);
}
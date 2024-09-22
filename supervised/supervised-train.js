import { getTF } from '../static/utils/get-tf.js';
import { Warhammer } from '../static/environment/warhammer.js';
import { MoveAgent } from '../static/agents/move-agent/move-center-agent.js';
import { getStateTensor } from '../static/utils/get-state-tensor.js';
import { createDeepQNetwork } from '../dqn/dqn.js';
import { getRandomInteger } from '../static/utils/index.js';

import gameSettings from '../static/settings/game-settings.json' assert { type: 'json' };
import allBattlefields from '../static/settings/battlefields.json' assert { type: 'json' };

import config from '../config.json' assert { type: 'json' };
const savePath = '../models/supervised-dqn/';

let battlefields = config.battlefields.length > 0 ? filterObjByKeys(allBattlefields, config.battlefields) : allBattlefields;

const tf = await getTF();

function gameToFeaturesAndLabel(record) {
	return tf.tidy(() => {
		const [input, orderIndex] = record;
		const features = getStateTensor([input], MoveAgent.settings.width,  MoveAgent.settings.height, MoveAgent.settings.channels).squeeze();
		const label = tf.oneHot(tf.scalar(orderIndex, 'int32'), MoveAgent.settings.orders.length);
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
		return [agent.getInput(state), orderIndex];
	}
	function* getStateAndAnswerGeneratorFn() {
		while(true) {
			yield getStateAndAnswer();
		}
	}

	const myGeneratorDataset = tf.data.generator(getStateAndAnswerGeneratorFn).filter(e =>
			(e[1] !== 0 || Math.random() > 0.5)
		);

	return myGeneratorDataset.map(gameToFeaturesAndLabel);
}
export async function train(nn) {
	const batchSize = 25;
	const epochs = 50;
	const dataset = getDataset().batch(batchSize);
	/*
	const countOrders = new Array(MoveAgent.settings.orders.length).fill(0);
	await getDataset().take(1000).forEachAsync(e => {
		countOrders[e[1]]++
	});
	console.log(countOrders)
	*/

	const model = createDeepQNetwork(MoveAgent.settings.orders.length, MoveAgent.settings.width, MoveAgent.settings.height, MoveAgent.settings.channels.length)
	model.add(tf.layers.softmax());
	const opimizer = tf.train.adamax(0.06863394)
	model.compile({
		optimizer: opimizer,
		loss: 'categoricalCrossentropy',
		metrics: ['accuracy'],
	});
	model.summary();
	await trainModelUsingFitDataset(model, dataset, epochs, batchSize);
}

export async function trainModelUsingFitDataset(model, dataset, epochs, batchSize) {
	const fitDatasetArgs = {
		batchesPerEpoch: batchSize,
		epochs: epochs,
		validationData: dataset,
		validationBatches: 30,
	};
	return await model.fitDataset(dataset, fitDatasetArgs);
}
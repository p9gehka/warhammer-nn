import * as fs from 'fs';
import shelljs from 'shelljs';
import { getTF } from './static/utils/get-tf.js';
import { Warhammer } from './static/environment/warhammer.js';
import { MoveAgent } from './static/agents/move-agent/move-center-agent.js';
import { getStateTensor } from './static/utils/get-state-tensor.js';
import { createDeepQNetwork } from './dqn/dqn.js';

import gameSettings from './static/settings/game-settings.json' assert { type: 'json' };
import allBattlefields from './static/settings/battlefields.json' assert { type: 'json' };

import config from './config.json' assert { type: 'json' };
const savePath = './models/supervised-dqn/';

let battlefields = config.battlefields.length > 0 ? filterObjByKeys(allBattlefields, config.battlefields) : allBattlefields;

const tf = await getTF();
const batchSize = 250;
const epochs = 100;
async function train(nn) {
	const env = new Warhammer({ gameSettings, battlefields });
	const agent = new MoveAgent();
	function getStateAndAnswer() {
		const state = env.getState();
		const { orderIndex, order } = agent.playStep(state);
		env.step({ ...order, id: env.players[state.player].models[0] });

		if (env.getState().done) {
			env.reset();
		}

		return [agent.getInput(state), agent.playStep(state).orderIndex];
	}
	function* getStateAndAnswerGeneratorFn() {
		while(true) {
			yield getStateAndAnswer();
		}
	}

	const myGeneratorDataset = tf.data.generator(getStateAndAnswerGeneratorFn).filter(e =>
		(e[1] !== 0 || Math.random() > 0.98) &&
		(e[1] !== 2 || Math.random() > 0.7) &&
		(e[1] !== 4 || Math.random() > 0.5) &&
		(e[1] !== 9 || Math.random() > 0.7) &&
		(e[1] !== 11 || Math.random() > 0.7) &&
		(e[1] !== 16 || Math.random() > 0.7) &&
		(e[1] !== 23 || Math.random() > 0.7) &&
		(e[1] !== 25 || Math.random() > 0.7)
	);
	const dataset = myGeneratorDataset.map(gameToFeaturesAndLabel)
		.batch(batchSize);
	/*
	const countOrders = new Array(agent.orders.length).fill(0);
	await myGeneratorDataset.take(10000).forEachAsync(e => countOrders[e[1]]++);
	console.log(countOrders)
	*/
	const model = createDeepQNetwork(agent.orders.length, agent.width, agent.height, agent.channels.length)
	model.add(tf.layers.softmax());
	const opimizer = tf.train.adam(config.learningRate)
	model.compile({
		optimizer: opimizer,
		loss: 'categoricalCrossentropy',
		metrics: ['accuracy'],
	});

	trainModelUsingFitDataset(model, dataset);

	function gameToFeaturesAndLabel(record) {
		return tf.tidy(() => {
			const [input, orderIndex] = record;
			const features = getStateTensor([input], agent.height, agent.width, agent.channels).squeeze();
			const label = tf.oneHot([orderIndex], agent.orders.length);
			return {xs: features, ys: label};
		});
	}
}

async function trainModelUsingFitDataset(model, dataset) {
	const trainLogs = [];
	const beginMs = performance.now();
	const fitDatasetArgs = {
		batchesPerEpoch: batchSize,
		epochs: epochs,
		validationData: dataset,
		validationBatches: 10,
		callbacks: {
			onEpochEnd: async (epoch, logs) => {
				// Plot the loss and accuracy values at the end of every training epoch.
				const secPerEpoch =
						(performance.now() - beginMs) / (1000 * (epoch + 1));
				console.log(`Training model... Approximately ` + `${secPerEpoch.toFixed(4)} seconds per epoch`);
				if (savePath != null) {
					if (!fs.existsSync(savePath)) {
						shelljs.mkdir('-p', savePath);
					}
					await model.save(`file://${savePath}`);
					console.log(`Saved DQN to ${savePath}`);
				}
			},
		}
	};
	await model.fitDataset(dataset, fitDatasetArgs);
}

async function main() {
	let nn;
	if (fs.existsSync(`${savePath}/model.json`)) {
		try {
			nn = await tf.loadLayersModel(`file://${savePath}/model.json`);
			console.log(`Loaded from ${savePath}/model.json`);
		} catch (e) {
			console.log(e.message);
		}
	}
	await train(nn);
}

main();

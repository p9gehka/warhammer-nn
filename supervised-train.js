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
const batchSize = 25;
const epochs = 100;
async function train(nn) {
	const env = new Warhammer({ gameSettings, battlefields });
	const agent = new MoveAgent();
	function getStateAndAnswer() {
		env.reset();
		const state = env.getState();
		env.reset()
		return [agent.getInput(state), agent.playStep(state).orderIndex];
	}
	function* getStateAndAnswerGeneratorFn() {
		while(true) {
			yield getStateAndAnswer();
		}
	}
	const myGeneratorDataset = tf.data.generator(getStateAndAnswerGeneratorFn);
	const dataset = myGeneratorDataset.map(gameToFeaturesAndLabel)
		.batch(batchSize);

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
			nn = await tf.loadLayersModel(`file://${config.savePath}/model.json`);
			console.log(`Loaded from ${config.savePath}/model.json`);
		} catch (e) {
			console.log(e.message);
		}
	}
	await train(nn);
}

main();

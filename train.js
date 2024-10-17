import * as fs from 'fs';
import shelljs from 'shelljs';

import { PlayerAgent } from './static/players/player-agent.js';
import { getTF } from './static/utils/get-tf.js';
import { ReplayMemoryClient } from './replay-memory/replay-memory-client.js';
import { isLocked } from './replay-memory/lock-api.js';
import { Trainer } from './dqn/trainer.js';
import gameSettings from './static/settings/game-settings.json' assert { type: 'json' };
import battlefields from './static/settings/battlefields.json' assert { type: 'json' };

import config from './config.json' assert { type: 'json' };

const tf = await getTF();

const { replayBufferSize, gamma, repeatBatchTraining, learningRate, freezeLayers } = config;

async function train(nn) {
	const replayMemory = new ReplayMemoryClient(replayBufferSize);
	await replayMemory.updateClient();

	const trainer = new Trainer(PlayerAgent.cascad, { nn, replayMemory });
	trainer.onlineNetwork.summary();
	await trainer.createTargetNetwork();
	const optimizer = tf.train.adam(learningRate);
	let epoch = 0;

	while (true) {
		if (epoch % config.syncEveryEpoch === 0) { /* sync не произойдет */
			trainer.copyWeights();
			console.log('Sync\'ed weights from online network to target network');
		}
		console.log(`epoch: ${epoch}`);
		trainer.trainOnReplayBatch(config.batchSize, gamma, optimizer, repeatBatchTraining);

		if (epoch % config.saveEveryEpoch === 0) {
			if (!fs.existsSync(config.savePath)) {
				shelljs.mkdir('-p', config.savePath);
			}
			await trainer.onlineNetwork.save(`file://${config.savePath}`);
			console.log(`Saved DQN to ${config.savePath}`);
			await replayMemory.updateClient();
			if (await isLocked()) {
				console.log('Memory locked, train terminated');
				break;
			}
		}

		epoch++;
	}
}

async function main() {
	let nn;
	if (fs.existsSync(`${config.savePath}/model.json`)) {
		try {
			nn = await tf.loadLayersModel(`file://${config.savePath}/model.json`);
			console.log(`Loaded from ${config.savePath}/model.json`);
			console.log(`Freese layers - ${freezeLayers} `)

			freezeLayers.forEach(layerName => {
				nn.getLayer(layerName).trainable = false
			});
		} catch (e) {
			console.log(e.message);
		}
	}
	await train(nn);
}

main();

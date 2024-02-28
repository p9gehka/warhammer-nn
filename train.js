import * as fs from 'fs';
import shelljs from 'shelljs';

import { Warhammer } from './static/environment/warhammer.js';
import { PlayerEnvironment } from './static/environment/player-environment.js';
import { getTF } from './static/utils/get-tf.js';
import { copyWeights } from './dqn/dqn.js';
import { fillReplayMemory } from './replay-memory/fill-replay-memory.js';
import { ReplayMemoryClient } from './replay-memory/replay-memory-client.js';
import { isLocked } from './replay-memory/lock-api.js';
import { Trainer } from './dqn/trainer.js';

import config from './config.json' assert { type: 'json' };

const tf = await getTF();

const { replayBufferSize, gamma } = config;

const learningRate = 1e-3;

async function train(nn) {
	const env = new Warhammer();
	const game = new PlayerEnvironment(0, env);
	const replayMemory = new ReplayMemoryClient(replayBufferSize);

	await replayMemory.updateClient();
	if (replayMemory.length < replayBufferSize) {
		fillReplayMemory(env, replayMemory);
	}

	const trainer = new Trainer(game, { nn: nn ?? undefined, replayMemory });
	trainer.onlineNetwork.summary();

	const optimizer = tf.train.adam(learningRate);
	let epoch = 0;

	while (true) {
		trainer.trainOnReplayBatch(config.batchSize, gamma, optimizer);
		console.log(`epoch: ${epoch}`);
		if (epoch % config.syncEveryEpoch === 0) { /* sync не произойдет */
			copyWeights(trainer.targetNetwork, trainer.onlineNetwork);
			console.log('Sync\'ed weights from online network to target network');
		}

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
	let nn = null
	if (fs.existsSync(`${config.savePath}/model.json`)) {
		nn = [];
		try {
			nn[0] = await tf.loadLayersModel(`file://${config.savePath}/model.json`);
			nn[1] = await tf.loadLayersModel(`file://${config.savePath}/model.json`);
			console.log(`Loaded from ${config.savePath}/model.json`);
		} catch (e) {
			console.log(e.message);
		}
	}
	await train(nn);
}

main();

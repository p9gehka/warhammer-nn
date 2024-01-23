import * as fs from 'fs';
import shelljs from 'shelljs';

import { Warhammer } from './environment/warhammer.js';
import { PlayerEnvironment } from './environment/player-environment.js';
import { getTF } from './dqn/utils.js';
import { copyWeights } from './dqn/dqn.js';
import { fillReplayMemory } from './environment/fill-replay-memory.js';
import { ReplayMemoryClient } from './replay-memory/replay-memory-client.js';
import { Trainer } from './dqn/trainer.js';

import { config } from './config.json' assert { type: 'json' };

const tf = await getTF();

const replayBufferSize = 4e4;
const batchSize = 64;
const gamma = 0.2;
const learningRate = 1e-3;
const syncEveryEpoch = 1e3;
const saveEveryEpoch = 5;

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
		trainer.trainOnReplayBatch(batchSize, gamma, optimizer);
		console.log(`epoch: ${epoch}`);
		if (epoch % syncEveryEpoch === 0) { /* sync не произойдет */
			copyWeights(trainer.targetNetwork, trainer.onlineNetwork);
			console.log('Sync\'ed weights from online network to target network');
		}

		if (epoch % saveEveryEpoch === 0) {
			if (!fs.existsSync(config.savePath)) {
				shelljs.mkdir('-p', config.savePath);
			}
			await trainer.onlineNetwork.save(`file://${config.savePath}`);
			console.log(`Saved DQN to ${config.savePath}`);
			await replayMemory.updateClient();
		}

		epoch++;
	}
}

async function main() {
	let nn = null
	if (fs.existsSync(`${config.savePath}/model.json`)) {
		console.log(`Loaded from ${config.savePath}/model.json`)
		nn = [];
		nn[0] = await tf.loadLayersModel(config.savePath);
		nn[1] = await tf.loadLayersModel(config.savePath);
	}
	await train(nn);
}

main();
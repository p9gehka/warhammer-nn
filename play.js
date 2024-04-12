import * as fs from 'fs';
import * as tf from '@tensorflow/tfjs-node';
import shelljs from 'shelljs';

import { Warhammer } from './static/environment/warhammer.js';
import { Action } from './static/environment/orders.js';
import { PlayerEnvironment } from './static/environment/player-environment.js';
import { RandomAgent } from './static/agents/random-agent0.1.js';
import { DumbAgent } from './static/agents/dumb-agent.js';
import { GameAgent } from './static/agents/game-agent0.1.js';
import { TestAgent } from './static/agents/test-agent.js';
import { ReplayMemoryClient } from './replay-memory/replay-memory-client.js';
import { sendDataToTelegram } from './visualization/utils.js';
import { MovingAverager } from './moving-averager.js';
import { lock } from './replay-memory/lock-api.js'

import config from './config.json' assert { type: 'json' };

const { replayBufferSize } = config;
const savePath = './static/models/dqn/';

const { cumulativeRewardThreshold, sendMessageEveryFrames, sleepTimer } = config;

const rewardAveragerLen = 100;

async function play() {
	const env = new Warhammer();
	let players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	const replayMemory = new ReplayMemoryClient(replayBufferSize);

	let agents = [new RandomAgent(players[0], { replayMemory }), new RandomAgent(players[1], { replayMemory })];

	async function tryUpdateModel() {
		try {
			const nn = await tf.loadLayersModel(config.loadPath)
			await nn?.save(`file://${savePath}/temp`);
			console.log(`Load model from ${config.loadPath} success`);
			if (agents[0].onlineNetwork === undefined) {
				agents[0] = new GameAgent(players[0], { nn, replayMemory, epsilonDecayFrames: config.epsilonDecayFrames });
				agents[1] = new GameAgent(players[1], { nn, replayMemory, epsilonDecayFrames: config.epsilonDecayFrames });
			} else {
				agents[0].onlineNetwork = nn;
				agents[1].onlineNetwork = nn;
			}
		} catch(e) {
			console.log(e.message)
			console.log(`Load model from ${config.loadPath} faile`);
		}
	}
	await tryUpdateModel();

	players[0].frameCount = 0;

	let state = env.reset();
	agents.forEach(agent => agent.reset());

	let averageRewardBest = -Infinity;
	let rewardAveragerBuffer = null;
	const rewardAverager = new MovingAverager(rewardAveragerLen);
	const frameTimeAverager100 = new MovingAverager(100);

	let frameCountPrev = 0;
	let t = new Date().getTime();

	while (true) {
		state = env.getState();
		let frameCount = players[0].frameCount;

		if (state.done) {
			agents.forEach(agent => agent.awarding());

			const currentFrameCount = frameCount - frameCountPrev; 
			const currentT = new Date().getTime();
			const framesPerSecond = currentFrameCount / (currentT - t) * 1e3;

			if (Number.isFinite(framesPerSecond)) {
				frameTimeAverager100.append(framesPerSecond);
			}
			rewardAverager.append(state.players[0].vp + players[0].cumulativeReward/1000);

			t = currentT;
			frameCountPrev = frameCount;

			const averageReward = rewardAverager.average();

			console.log(
				`Frame #${frameCount}: ` +
				`cumulativeVP${rewardAveragerLen}=${averageReward.toFixed(1)}; ` +
				`(epsilon=${agents[0].epsilon?.toFixed(3)}) ` +
				`(${framesPerSecond.toFixed(1)} frames/s)`);

			if (averageReward >= cumulativeRewardThreshold) {
				await lock();
				if (savePath != null) {
					if (!fs.existsSync(savePath)) {
						shelljs.mkdir('-p', savePath);
					}

					await agents[0].onlineNetwork?.save(`file://${savePath}`);
					if (agents[0].onlineNetwork) {
						console.log(`Saved DQN to ${savePath} final`);
					}
				}
				await sendDataToTelegram(
					rewardAveragerBuffer.buffer.filter(v => v !== null),
					`Training done - averageReward${rewardAveragerLen}:${averageReward.toFixed(1)} cumulativeRewardThreshold ${cumulativeRewardThreshold}`
				);
				break;
			}

			if (averageReward > averageRewardBest && rewardAverager.isFull()) {
				averageRewardBest = averageReward;
				if (savePath != null) {
					if (!fs.existsSync(savePath)) {
						shelljs.mkdir('-p', savePath);
					}
					await agents[0].onlineNetwork?.save(`file://${savePath}`);
					console.log(`Saved DQN to ${savePath}`);
				}
			}

			state = env.reset();
			agents.forEach(agent => agent.reset());
		}

		if (agents[0].onlineNetwork !== undefined && frameCount !== null && frameCount % sendMessageEveryFrames === 0 && rewardAveragerBuffer !== null) {
			const testActions = [];
			const testAgents = [new TestAgent(players[0], { nn: agents[0].onlineNetwork }), new DumbAgent(players[1])]
			let testAttempst = 0;
			let testState = env.reset();
			agents.forEach(agent => agent.reset());

			while (!testState.done && testAttempst < 100) {
				testState = env.getState();
				if (testState.done) {
					break;
				}

				let actionInfo = testAgents[testState.player].playStep().at(-1);
				if (testState.player === 0) {
					testActions.push(actionInfo);
				}
				testAttempst++;
			}

			env.reset();
			agents.forEach(agent => agent.reset());
			/*
			console.log(
				rewardAveragerBuffer.buffer.filter(v => v !== null),
				`Frame #${frameCount}::Epsilon ${agents[0].epsilon?.toFixed(3)}::${frameTimeAverager100.average().toFixed(1)} frames/s:`+
				`:${JSON.stringify(testActions)}:`
			)
			*/
			await sendDataToTelegram(
				rewardAveragerBuffer.buffer.filter(v => v !== null),
				`Frame #${frameCount}::Epsilon ${agents[0].epsilon?.toFixed(3)}::averageReward${rewardAveragerLen}Best ${averageRewardBest}::${frameTimeAverager100.average().toFixed(1)} frames/s:`+
				`:${JSON.stringify(testActions)}:`
			);
		}

		if (frameCount % 1000 === 0) {
			if (rewardAveragerBuffer === null) {
				rewardAveragerBuffer = new MovingAverager(config.rewardAveragerBufferLength);
			}

			rewardAveragerBuffer.append({ frame: frameCount, averageReward: rewardAverager.average()});
		}

		if(replayMemory.length === replayBufferSize) {
			console.log('Update server buffer');
			console.log(`averageReward${rewardAveragerLen}Best: ${averageRewardBest}`)
			await replayMemory.updateServer();
			replayMemory.clean();
			await tryUpdateModel();
		}
		agents[state.player].playStep();
		await(new Promise((resolve) => { setTimeout(resolve, sleepTimer)}))
	}
}

async function main() {
	await play();
}

main();

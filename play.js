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
import { sendDataToTelegram, sendMessage, memoryUsage } from './visualization/utils.js';
import { MovingAverager } from './moving-averager.js';
import { lock } from './replay-memory/lock-api.js'
import { filterObjByKeys } from './static/utils/index.js';
import { getTrainerConfig } from './replay-memory/trainer-config.js';

import gameSettings from './static/settings/game-settings.json' assert { type: 'json' };
import allBattlefields from './static/settings/battlefields.json' assert { type: 'json' };

import config from './config.json' assert { type: 'json' };

const savePath = './static/models/dqn/';

const { cumulativeRewardThreshold, sendMessageEveryFrames, replayBufferSize, replayMemorySize, epsilonDecayFrames, framesThreshold } = config;

const rewardAveragerLen = 100;

let battlefields = config.battlefields.length > 0 ? filterObjByKeys(allBattlefields, config.battlefields) : allBattlefields;

let configMessageSended = false;

async function sendConfigMessage() {
	if (configMessageSended) { return; }
	const trainerConfig = await getTrainerConfig();
	await sendMessage(
		`Player hyperparams Config replayBufferSize:${replayBufferSize} epsilonDecayFrames:${epsilonDecayFrames} cumulativeRewardThreshold:${cumulativeRewardThreshold}\n` +
		`Trainer hyperparams replayMemorySize: ${trainerConfig.replayMemorySize} replayBufferSize:${trainerConfig.replayBufferSize} learningRate:${trainerConfig.learningRate} syncEveryEpoch:${trainerConfig.syncEveryEpoch} saveEveryEpoch:${trainerConfig.saveEveryEpoch} batchSize:${trainerConfig.batchSize}`
	);
	configMessageSended = true;
}

async function play() {
	const env = new Warhammer({ gameSettings, battlefields });

	let players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	const replayMemory = new ReplayMemoryClient(replayBufferSize);

	let agents = [new RandomAgent(players[0], { replayMemory }), new RandomAgent(players[1], { replayMemory })];

	async function tryUpdateModel() {
		try {
			const nn = await tf.loadLayersModel(config.loadPath);
			await nn?.save(`file://${savePath}/temp`);
			console.log(`Load model from ${config.loadPath} success`);
			if (agents[0].onlineNetwork === undefined) {
				agents[0] = new GameAgent(players[0], { nn, replayMemory, epsilonDecayFrames: config.epsilonDecayFrames });
				agents[1] = new GameAgent(players[1], { nn, replayMemory, epsilonDecayFrames: config.epsilonDecayFrames });
			} else {
				agents[0].onlineNetwork.dispose();
				agents[0].onlineNetwork = nn;
				agents[1].onlineNetwork = nn;
			}
		} catch(e) {
			console.log(e.message)
			console.log(`Load model from ${config.loadPath} faile`);
		}
	}
	await tryUpdateModel();

	let state = env.reset();
	agents.forEach(agent => agent.reset());

	let averageVPBest = -Infinity;
	let vpAveragerBuffer = null;
	let rewardAveragerBuffer = null;
	const vpAverager = new MovingAverager(rewardAveragerLen);
	const rewardAverager = new MovingAverager(rewardAveragerLen);
	const frameTimeAverager100 = new MovingAverager(100);

	let frameCountPrev = 0;
	let frameCount = 0;
	let t = new Date().getTime();

	while (true) {
		state = env.getState();

		if (state.done) {
			agents.forEach(agent => agent.awarding());

			const currentFrameCount = frameCount - frameCountPrev; 
			const currentT = new Date().getTime();
			const framesPerSecond = currentFrameCount / (currentT - t) * 1e3;

			if (Number.isFinite(framesPerSecond)) {
				frameTimeAverager100.append(framesPerSecond);
			}
			vpAverager.append(state.players[0].primaryVP + players[0].cumulativeReward/1000);
			rewardAverager.append(players[0].cumulativeReward);

			t = currentT;
			frameCountPrev = frameCount;

			const averageVP = vpAverager.average();
			const averageReward = rewardAverager.average();

			console.log(
				`Frame #${frameCount}: ` +
				`cumulativeVP${rewardAveragerLen}=${averageVP.toFixed(1)}; ` +
				`cumulativeReward${rewardAveragerLen}=${averageReward.toFixed(1)}; ` +
				`(epsilon=${agents[0].epsilon?.toFixed(3)}) ` +
				`(${framesPerSecond.toFixed(1)} frames/s)`
			);

			if (averageVP >= cumulativeRewardThreshold || frameCount > framesThreshold) {
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
				await sendConfigMessage();
				await sendDataToTelegram(vpAveragerBuffer.buffer.filter(v => v !== null));
				await sendDataToTelegram(rewardAveragerBuffer.buffer.filter(v => v !== null));
				await sendMessage(
					`Training done - averageVP${rewardAveragerLen}:${averageVP.toFixed(1)} cumulativeRewardThreshold ${cumulativeRewardThreshold}`
				);
				break;
			}

			if (averageVP > averageVPBest && vpAverager.isFull()) {
				averageVPBest = averageVP;
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

		if (state.player === 0 && agents[0].onlineNetwork !== undefined && frameCount % sendMessageEveryFrames === 0 && vpAveragerBuffer !== null && rewardAveragerBuffer !== null) {
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
			await sendConfigMessage();
			await sendDataToTelegram(vpAveragerBuffer.buffer.filter(v => v !== null));
			await sendDataToTelegram(rewardAveragerBuffer.buffer.filter(v => v !== null));
			
			await sendMessage(
				`Frame #${frameCount}::Epsilon ${agents[0].epsilon?.toFixed(3)}::averageVP${rewardAveragerLen}Best ${averageVPBest}::${frameTimeAverager100.average().toFixed(1)} frames/s:`+
				`:${JSON.stringify(testActions)}:`
			);
			await sendMessage(JSON.stringify(memoryUsage()));
		}

		if (frameCount % 1000 === 0) {
			if (vpAveragerBuffer === null) {
				vpAveragerBuffer = new MovingAverager(config.rewardAveragerBufferLength);
			}

			vpAveragerBuffer.append({ frame: frameCount, averageVP: vpAverager.average()});

			if (rewardAveragerBuffer === null) {
				rewardAveragerBuffer = new MovingAverager(config.rewardAveragerBufferLength);
			}

			rewardAveragerBuffer.append({ frame: frameCount, averageReward: rewardAverager.average()});
		}

		if(replayMemory.length === replayBufferSize) {
			console.log(`averageVP${rewardAveragerLen}Best: ${averageVPBest}`)
			console.time('updateMemory');
			await replayMemory.updateServer();
			replayMemory.clean();
			console.timeEnd('updateMemory');
			console.time('updateModel');
			await tryUpdateModel();
			console.timeEnd('updateModel');
		}
		agents[state.player].playStep();
		if(state.player === 0) {
			frameCount++;
		}
	}
}

async function main() {
	await play();
}

main();

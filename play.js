import * as fs from 'fs';
import * as tf from '@tensorflow/tfjs-node';
import shelljs from 'shelljs';

import { Warhammer } from './static/environment/warhammer.js';
import { PlayerDumb } from './static/players/player-dumb.js';
import { PlayerEasy } from './static/players/player-easy.js';
import { ReplayMemoryClient } from './replay-memory/replay-memory-client.js';
import { sendDataToTelegram, sendMessage, memoryUsage } from './visualization/utils.js';
import { MovingAverager } from './moving-averager.js';
import { lock } from './replay-memory/lock-api.js'
import { filterObjByKeys } from './static/utils/index.js';
import { getTrainerConfig } from './replay-memory/trainer-config.js';
import { Student } from './students/student.js';
import gameSettings from './static/settings/game-settings.json' assert { type: 'json' };
import allBattlefields from './static/settings/battlefields.json' assert { type: 'json' };

import config from './config.json' assert { type: 'json' };

const savePath = './models/play-dqn/';

const { cumulativeRewardThreshold, sendMessageEveryFrames, replayBufferSize, replayMemorySize, epsilonDecayFrames, framesThreshold, epsilonInit } = config;

const rewardAveragerLen = 200;

let battlefields = config.battlefields.length > 0 ? filterObjByKeys(allBattlefields, config.battlefields) : allBattlefields;

let configMessageSended = false;

async function sendConfigMessage(model) {
	if (configMessageSended) { return; }
	const trainerConfig = await getTrainerConfig();

	await sendMessage(
		model.layers.map(layer => `${layer.name.split('_')[0]}{${ ['filters', 'kernelSize', 'units', 'rate'].map(filter => layer[filter] ? `filter: ${layer[filter]}` : '').filter(v=>v !=='') }}` ).join('->')
	);
	await sendMessage(
		`Player hyperparams Config replayBufferSize:${replayBufferSize} epsilonDecayFrames:${epsilonDecayFrames} cumulativeRewardThreshold:${cumulativeRewardThreshold}\n` +
		`Trainer hyperparams replayMemorySize: ${trainerConfig.replayMemorySize} replayBufferSize:${trainerConfig.replayBufferSize} learningRate:${trainerConfig.learningRate} syncEveryEpoch:${trainerConfig.syncEveryEpoch} saveEveryEpoch:${trainerConfig.saveEveryEpoch} batchSize:${trainerConfig.batchSize}`
	);
	configMessageSended = true;
}

async function play() {
	const env = new Warhammer({ gameSettings, battlefields });

	const replayMemory = new ReplayMemoryClient(replayBufferSize);
	const players = [new Student(0, env, { replayMemory, epsilonDecayFrames: config.epsilonDecayFrames, epsilonInit }), new PlayerEasy(1, env)];

	async function tryUpdateModel() {
		try {
			const nn = await tf.loadLayersModel(config.loadPath);
			await nn?.save(`file://${savePath}/temp`);
			console.log(`Load model from ${config.loadPath} success`);
			players[0].getOnlineNetwork()?.dispose();
			players[0].setOnlineNetwork(nn);
		} catch(e) {
			console.log(e.message)
			console.log(`Load model from ${config.loadPath} faile`);
		}
	}
	await tryUpdateModel();

	let state = env.reset();
	players.forEach(player => player.reset());

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
			players.forEach(agent => { 
				if (agent.awarding) {
					agent.awarding();
				}
			});
			const currentFrameCount = frameCount - frameCountPrev; 
			const currentT = new Date().getTime();
			const framesPerSecond = currentFrameCount / (currentT - t) * 1e3;

			if (Number.isFinite(framesPerSecond)) {
				frameTimeAverager100.append(framesPerSecond);
			}
			vpAverager.append(state.players[0].primaryVP);
			rewardAverager.append(players[0].getCumulativeReward());

			t = currentT;
			frameCountPrev = frameCount;

			const averageVP = vpAverager.average();
			const averageReward = rewardAverager.average();

			console.log(
				`Frame #${frameCount}: ` +
				`cumulativeVP${rewardAveragerLen}=${averageVP.toFixed(1)}; ` +
				`cumulativeReward${rewardAveragerLen}=${averageReward.toFixed(1)}; ` +
				`(epsilon=${players[0].epsilon?.toFixed(3)}) ` +
				`(${framesPerSecond.toFixed(1)} frames/s)`
			);

			state = env.reset();
			players.forEach(agent => agent.reset());
		}

		if (state.player === 0 && players[0].getOnlineNetwork() !== undefined && frameCount % sendMessageEveryFrames === 0 && vpAveragerBuffer !== null && rewardAveragerBuffer !== null) {
			const testActions = [];

			const testAgents = [players[0].player, new PlayerDumb(env)]
			let testAttempst = 0;
			let testState = env.reset();

			while (!testState.done && testAttempst < 100) {
				testState = env.getState();
				if (testState.done) {
					break;
				}

				let actionData = testAgents[testState.player].playStep().at(-1);
				if (testState.player === 0) {
					testActions.push(`${actionData.index}(${actionData.estimate})`);
				}
				testAttempst++;
			}
			await sendConfigMessage(players[0].getOnlineNetwork());
			await sendDataToTelegram(vpAveragerBuffer.buffer.filter(v => v !== null));
			await sendDataToTelegram(rewardAveragerBuffer.buffer.filter(v => v !== null));
			await sendMessage(
				[
					`Frame #${frameCount}::Epsilon ${players[0].epsilon?.toFixed(3)}::averageVP${rewardAveragerLen}Best ${averageVPBest}::${frameTimeAverager100.average().toFixed(1)} frames/s:`,
					`:${JSON.stringify(testActions.join(','))}:`,
					`heapMemory:${memoryUsage()['heapUsed']}`
				].join()
			);

			env.reset();
			players.forEach(agent => agent.reset());
		}


		if (replayMemory.length === replayMemory.maxLen) {
			if (vpAveragerBuffer === null) {
				vpAveragerBuffer = new MovingAverager(config.rewardAveragerBufferLength);
			}

			vpAveragerBuffer.append({ frame: frameCount, averageVP: vpAverager.average()});

			if (rewardAveragerBuffer === null) {
				rewardAveragerBuffer = new MovingAverager(config.rewardAveragerBufferLength);
			}

			rewardAveragerBuffer.append({ frame: frameCount, averageReward: rewardAverager.average() });
			const averageVP = vpAverager.average();

			if (averageVP > averageVPBest) {
				averageVPBest = averageVP;
				if (savePath != null) {
					if (!fs.existsSync(savePath)) {
						shelljs.mkdir('-p', savePath);
					}
					await players[0].getOnlineNetwork()?.save(`file://${savePath}`);
					console.log(`Saved DQN to ${savePath}`);
				}
			}

			console.log(`averageVP$Best: ${averageVPBest}, lastAverageLen: ${vpAverager.length}, vpAveragerBufferLength: ${vpAveragerBuffer.length}, vpAveragerBufferLength2: ${vpAveragerBuffer.buffer.length}`)
			console.time('updateMemory');

			if (averageVPBest >= cumulativeRewardThreshold || frameCount > framesThreshold ) {
				await lock();

				if (players[0].getOnlineNetwork() !== undefined) {
					await sendConfigMessage(players[0].getOnlineNetwork());
				}

				await sendDataToTelegram(vpAveragerBuffer.buffer.filter(v => v !== null));
				await sendDataToTelegram(rewardAveragerBuffer.buffer.filter(v => v !== null));
				await sendMessage(
					`Training done - averageVP${rewardAveragerLen}Best ${averageVP} cumulativeRewardThreshold ${cumulativeRewardThreshold}`
				);
				break;
			}

			if (savePath != null && averageVP >= cumulativeRewardThreshold) {
				if (!fs.existsSync(savePath)) {
					shelljs.mkdir('-p', savePath);
				}

				await players[0].getOnlineNetwork()?.save(`file://${savePath}`);
				if (players[0].getOnlineNetwork()) {
					console.log(`Saved DQN to ${savePath} final`);
				}
			}

			await replayMemory.updateServer();
			replayMemory.clean();
			console.timeEnd('updateMemory');
			console.time('updateModel');
			await tryUpdateModel();

			vpAverager.empty();
			rewardAverager.empty();

			console.timeEnd('updateModel');
		}
		players[state.player].playStep();
		if (state.player === 0) {
			frameCount++;
		}
	}
}

async function main() {
	await play();
}

main();

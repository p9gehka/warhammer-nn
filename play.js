import * as fs from 'fs';
import * as tf from '@tensorflow/tfjs-node';
import shelljs from 'shelljs';

import { Warhammer } from './environment/warhammer.js';
import { PlayerEnvironment, Action } from './environment/player-environment.js';
import { RandomAgent } from './agents/random-agent0.1.js';
import { DumbAgent } from './agents/dumb-agent.js';
import { GameAgent } from './agents/game-agent0.1.js';
import { TestAgent } from './agents/test-agent.js';
import { ReplayMemoryClient } from './replay-memory/replay-memory-client.js';
import { sendDataToTelegram } from './visualization/utils.js';
import { MovingAverager } from './moving-averager.js';

const replayBufferSize = 1e4;
const savePath = './models/dqn';
const cumulativeRewardThreshold = 20;
const sendMessageEveryFrames = 3e4;
const rewardAverager100Len = 100;


async function play(nn) {
	const env = new Warhammer();
	let players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	const replayMemory = new ReplayMemoryClient(replayBufferSize);
	const agents = [new GameAgent(players[0], { nn: nn ?? undefined, replayMemory }), new DumbAgent(players[1])];

	players[0].frameCount = 0;
	players[1].frameCount = 0;

	let state = env.reset();
	agents.forEach(agent => agent.reset());

	let averageReward100Best = -Infinity;
	let rewardAveragerBuffer = null;
	const rewardAverager100 = new MovingAverager(rewardAverager100Len);
	const frameTimeAverager100 = new MovingAverager(100);

	let frameCountPrev = 0;
	let frameCount = 0;
	let t = new Date().getTime();

	while (true) {
		state = env.getState();
		frameCount = players[0].frameCount + players[1].frameCount;
		if (state.done) {
			agents.forEach(agent => agent.awarding());
			const currentFrameCount = frameCount - frameCountPrev; 
			const currentT = new Date().getTime();
			const framesPerSecond = currentFrameCount / (currentT - t) * 1e3;
			const cumulativeReward = players[0].cumulativeReward;
			frameTimeAverager100.append(framesPerSecond);
			rewardAverager100.append(cumulativeReward);

			t = currentT;
			frameCountPrev = frameCount;

			const averageReward100 = rewardAverager100.average();
			if (rewardAveragerBuffer === null) {
				rewardAveragerBuffer = new MovingAverager(1000);
			}

			rewardAveragerBuffer.append({ frame: frameCount, averageReward: averageReward100});
			console.log(
				`Frame #${frameCount}: ` +
				`cumulativeReward100=${averageReward100.toFixed(1)}; ` +
				`(epsilon=${agents[0].epsilon.toFixed(3)}) ` +
				`(${framesPerSecond.toFixed(1)} frames/s)`);
			/*
			if (averageReward100 >= cumulativeRewardThreshold) {
				if (savePath != null) {
					if (!fs.existsSync(savePath)) {
						shelljs.mkdir('-p', savePath);
					}
					await agents[0].onlineNetwork.save(`file://${savePath}`);
					console.log(`Saved DQN to ${savePath}`);
				}
				break;
			}

			if (averageReward100 > averageReward100Best && rewardAverager100.isFull()) {
				averageReward100Best = averageReward100;
				if (savePath != null) {
					if (!fs.existsSync(savePath)) {
						shelljs.mkdir('-p', savePath);
					}
					await agents[0].onlineNetwork.save(`file://${savePath}`);
					console.log(`Saved DQN to ${savePath}`);
				}
			}
			*/
			state = env.reset();
			agents.forEach(agent => agent.reset());
		}

		if (frameCount !== null && frameCount % sendMessageEveryFrames === 0 && rewardAveragerBuffer !== null) {
			const testActions = [];
			const testAgents = [new TestAgent(players[0], { nn: [agents[0].onlineNetwork] }), new DumbAgent(players[1])]
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
				`Frame #${frameCount}::Epsilon ${agents[0].epsilon.toFixed(3)}::${frameTimeAverager100.average().toFixed(1)} frames/s:`+
				`:${JSON.stringify(testActions)}:`
			)
			*/
			await sendDataToTelegram(
				rewardAveragerBuffer.buffer.filter(v => v !== null),
				`Frame #${frameCount}::Epsilon ${agents[0].epsilon.toFixed(3)}::${frameTimeAverager100.average().toFixed(1)} frames/s:`+
				`:${JSON.stringify(testActions)}:`
			);
		}

		if(replayMemory.length === replayBufferSize) {
			console.log('Update server buffer');
			await replayMemory.updateServer();
			replayMemory.clean();
		}
		agents[state.player].playStep();
	}
}

async function main() {
	let nn = null
	if (fs.existsSync(`${savePath}/model.json`)) {
		console.log(`Loaded from ${savePath}/model.json`)
		nn = [];
		nn[0] = await tf.loadLayersModel(`file://${savePath}/model.json`);
		nn[1] = await tf.loadLayersModel(`file://${savePath}/model.json`);
	}
	await play(nn);
}

main();
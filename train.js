import { Warhammer, } from './environment/warhammer.js';
import { PlayerEnvironment, Action } from './environment/player-environment.js';
import { RandomAgent } from './agents/random-agent0.1.js';
import { GameAgent } from './agents/game-agent0.1.js';
import { TestAgent } from './agents/test-agent.js';
import { getTF } from './dqn/utils.js';
import { ReplayMemory } from './dqn/replay_memory.js';
import { copyWeights } from './dqn/dqn.js';
import shelljs from 'shelljs';
import { sendDataToTelegram, sendMesage } from './visualization/utils.js';

import * as fs from 'fs';
let tf = await getTF();

class MovingAverager {
  constructor(bufferLength) {
	this.buffer = [];
	this._full = false;
	for (let i = 0; i < bufferLength; ++i) {
	  this.buffer.push(null);
	}
  }
  isFull() {
	if(this._fill) { return true };
	this._fill = this.buffer.every(v=> v !== null);
	return this._fill
  }
  append(x) {
	this.buffer.shift();
	this.buffer.push(x);
  }

  average() {
	return this.buffer.reduce((x, prev) => x + prev) / this.buffer.length;
  }
}
const actionsProb = {
	0: 0.03,
	1: 0.03,
	2: 0.03,
	31: 0.1,
	32: 0.1,
}

const replayBufferSize = 1e5;
const batchSize = 256;
const gamma = 0.99;
const learningRate = 1e-3;
const savePath = './models/dqn';
const cumulativeRewardThreshold = 40;
const syncEveryFrames = 6e3;
const sendMessageEveryFrames = 3e4;
const rewardAverager100Len = 100;

async function train(nn) {
	const env = new Warhammer();
	const replayMemory = new ReplayMemory(replayBufferSize);
	let players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	let agents = [
		nn == null ? new RandomAgent(players[0], { replayMemory, actionsProb }): new GameAgent(players[0],{ replayMemory, nn, actionsProb }),
		new RandomAgent(players[1])
	];


	let state = env.reset();
	while (replayMemory.length < replayBufferSize ) {
		state = env.getState();
		if (state.done) {
			state = env.reset();
			players.forEach(player=> player.reset());
		}
		agents[state.player].playStep();
	}

	if (nn === null) {
		agents = [new GameAgent(players[0], { replayMemory, actionsProb }), new RandomAgent(players[1] )];
	}
	agents[0].onlineNetwork.summary()
	players[0].frameCount = 0;
	players[1].frameCount = 0;

	env.reset();

	let averageReward100Best = -Infinity;
	let rewardAveragerBuffer = null;

	const optimizer = tf.train.adam(learningRate);
	const rewardAverager100 = new MovingAverager(rewardAverager100Len);
	const frameTimeAverager100 = new MovingAverager(100);

	let frameCountPrev = 0;
	let frameCount = 0;
	let t = new Date().getTime();

	while (true) {
		state = env.getState();
		frameCount = players[0].frameCount + players[1].frameCount;

		if (state.done) {
			const currentFrameCount = frameCount - frameCountPrev; 
			const currentT = new Date().getTime();
			const framesPerSecond = currentFrameCount / (currentT - t) * 1e3;
			const cumulativeReward = players[0].cumulativeReward;
			frameTimeAverager100.append(framesPerSecond)
			rewardAverager100.append(cumulativeReward)

			t = currentT;
			frameCountPrev = frameCount

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

			if (averageReward100 >= cumulativeRewardThreshold) {
			  if (savePath != null) {
					 if (!fs.existsSync(savePath)) {
					   shelljs.mkdir('-p', savePath);
					 }
					 await agents[0].onlineNetwork.save(`file://${savePath}`);
					 await sendMesage('Train Completed!!!');
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
			state = env.reset();
			players.forEach(p => p.reset());
		}

		if (frameCount % syncEveryFrames === 0) { /* sync не произойдет */
		  copyWeights(agents[0].targetNetwork, agents[0].onlineNetwork);
		  console.log('Sync\'ed weights from online network to target network');
		}
		if (frameCount !== null && frameCount % sendMessageEveryFrames === 0 && rewardAveragerBuffer !== null) {

			const counterPhases = {};
			const counterAction = {};
			replayMemory.buffer.forEach((v, i)=> {
				if (!(v[1] in counterAction)) {
					counterAction[v[1]] = 0
				}
				counterPhases[v[0].turn]++;
				counterAction[v[1]]++;
			});


			const testActions = [];
			const testAgents = [new TestAgent(players[0], { nn: [agents[0].onlineNetwork] }), new RandomAgent(players[1])]
			let testAttempst = 0;
			let testState = env.reset();
			while (!testState.done && testAttempst < 100) {
				testState = env.getState();
				if (testState.done) {
				  break;
				}

				let actionIndex = testAgents[testState.player].playStep();
				if (testState.player == 0) {
					testActions.push(actionIndex)
				}
				testAttempst++;
			 }
			 env.reset();
			 players.forEach(p => p.reset());
			await sendDataToTelegram(
				rewardAveragerBuffer.buffer.filter(v => v !== null),
				Object.entries(counterAction).map(([action, value]) => ({ action: Number(action), value })),
				`Frame #${frameCount}::Epsilon ${agents[0].epsilon.toFixed(3)}::${frameTimeAverager100.average().toFixed(1)} frames/s:`+
				`:${JSON.stringify(testActions)}:`
			);
			
			
		}
		agents[state.player].trainOnReplayBatch(batchSize, gamma, optimizer);
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
	await train(nn);
}

main();
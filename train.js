import { Warhammer, } from './environment/warhammer.js';
import { PlayerEnvironment, Action } from './environment/player-environment.js';
import { RandomAgent } from './agents/random-agent0.1.js';
import { GameAgent } from './agents/game-agent0.1.js';
import { ReplayMemory } from './dqn/replay_memory.js';
import { copyWeights } from './dqn/dqn.js';
import * as fs from 'fs';
import shelljs from 'shelljs';
import * as tf from '@tensorflow/tfjs-node';

class MovingAverager {
  constructor(bufferLength) {
    this.buffer = [];
    for (let i = 0; i < bufferLength; ++i) {
      this.buffer.push(null);
    }
  }

  append(x) {
    this.buffer.shift();
    this.buffer.push(x);
  }

  average() {
    return this.buffer.reduce((x, prev) => x + prev) / this.buffer.length;
  }
}

const replayBufferSize = 5e4;
const batchSize = 128;
const gamma = 0.99;
const learningRate = 1e-3;
const savePath = './models/dqn';
const cumulativeRewardThreshold = 220;
const syncEveryFrames = 5e3;

async function train() {
	const env = new Warhammer();
	const replayMemory = new ReplayMemory(replayBufferSize);
	let players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	let agents = [new RandomAgent(players[0], { replayMemory }), new RandomAgent(players[1], { replayMemory })];
	let state = env.reset();

	for (let i = 0; i < replayBufferSize; ++i) {
		state = env.getState();
		if (state.done) {
			state = env.reset();
			players.forEach(player=> player.reset());
			agents.forEach(a=> a.reset());
		}
		agents[state.player].playStep();
	}
	players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	agents = [new GameAgent(players[0], { replayMemory }), new RandomAgent(players[1], { replayMemory })];
	env.reset();
	let tPrev = new Date().getTime();
	let frameCountPrev = players[0].frameCount + players[1].frameCount;
	let averageReward100Best = -Infinity;
	const optimizer = tf.train.adam(learningRate);
	const rewardAverager100 = new MovingAverager(100);
	let frameCount = 0;
	while (true) {
		const t = new Date().getTime();
		frameCount = players[0].frameCount + players[1].frameCount;
		const framesPerSecond =
		    (frameCount - frameCountPrev) / ((t - tPrev) * 1e3 + 1);
		tPrev = t;
		frameCountPrev = frameCount;

		state = env.getState();
		
		if (state.done) {
			const cumulativeReward = players[0].cumulativeReward;
			rewardAverager100.append(cumulativeReward)
			const averageReward100 = rewardAverager100.average();

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
			         console.log(`Saved DQN to ${savePath}`);
			       }
			  break;
			}
			if (averageReward100 > averageReward100Best) {
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
		 	agents.forEach(a => a.reset());
		}
		if (frameCount % syncEveryFrames === 0) { /* sync не произойдет */
		  copyWeights(agents[0].targetNetwork, agents[0].onlineNetwork);
		  console.log('Sync\'ed weights from online network to target network');
		}
		agents[state.player].trainOnReplayBatch(batchSize, gamma, optimizer);
		agents[state.player].playStep();
	}
}

async function main() {
	await train();
}

main();
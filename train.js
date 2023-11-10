import { Warhammer, } from './environment/warhammer.js';
import { PlayerEnvironment, Action } from './environment/player-environment.js';
import { RandomAgent } from './agents/random-agent0.1.js';
import { GameAgent } from './agents/game-agent0.1.js';
import { getTF } from './dqn/utils.js';
import { ReplayMemory } from './dqn/replay_memory.js';
import { copyWeights } from './dqn/dqn.js';
import shelljs from 'shelljs';
import { sendDataToTelegram } from './visualization/utils.js';

import * as fs from 'fs';
let tf = await getTF();

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
const syncEveryFrames = 4e3;
const sendMessageEveryFrames  = 6e4;

async function train(nn) {
	const env = new Warhammer();
	const replayMemory = new ReplayMemory(replayBufferSize);
	let players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	let agents = [
		nn == null ? new RandomAgent(players[0], { replayMemory }): new GameAgent(players[0],{ replayMemory, nn }),
		new RandomAgent(players[1], { replayMemory })
	];


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

	if (nn === null) {
		agents = [new GameAgent(players[0], { replayMemory }), new RandomAgent(players[1], { replayMemory })];
	}
	players[0].frameCount = 0;
	players[1].frameCount = 0;

	env.reset();
	let tPrev = new Date().getTime();
	let frameCountPrev = players[0].frameCount + players[1].frameCount;
	let averageReward100Best = -Infinity;
	const optimizer = tf.train.adam(learningRate);
	const rewardAverager100 = new MovingAverager(100);
	const rewardAveragerBuffer = new MovingAverager(1000);

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
		if (frameCount !== null && frameCount % sendMessageEveryFrames === 0 && rewardAveragerBuffer.buffer.some(v => v !== null)) {
			await sendDataToTelegram(rewardAveragerBuffer.buffer.filter(v => v!== null), `Frame #${frameCount}: Epsilon ${agents[0].epsilon}:`)
		}
		agents[state.player].trainOnReplayBatch(batchSize, gamma, optimizer);
		agents[state.player].playStep();
	}
}

async function main() {
	let nn = null
	if (fs.existsSync(`${savePath}/model.json`)) {
		console.log(`Loaded from ${savePath}/model.json`)
		nn = await tf.loadLayersModel(`file://${savePath}/model.json`)
	}
	await train(nn);
}

main();
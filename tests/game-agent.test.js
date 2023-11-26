import tf from '@tensorflow/tfjs-node';
import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';
import { GameAgent } from '../agents/game-agent0.1.js';
import { ReplayMemoryByAction } from '../environment/replay-memory-by-action.js';
import { fillReplayMemory } from '../environment/fill-replay-memory.js';
import { ReplayMemory } from '../dqn/replay_memory.js';
import { ControlledAgent } from '../agents/controlled-agent.js';
import { getStateTensor } from '../agents/utils.js';
import { copyWeights } from '../dqn/dqn.js';

import battlefields from './mock/battlefields.json' assert { type: 'json' };
import gameSettings from './mock/game-settings.json' assert { type: 'json' };

describe('game agent', () => {
	const nn = [];
	let env = null;
	let env2 = null
	let player = null;
	let gameAgent = null;
	let optimizer = null;
	beforeAll(async () => {
		nn[0] = await tf.loadLayersModel(`file://tests/mock/dqn-test/model.json`);
		nn[1] = await tf.loadLayersModel(`file://tests/mock/dqn-test/model.json`);
		env = new Warhammer({ gameSettings, battlefields });
		const env2Models = [...gameSettings.models];
		env2Models[0] = [4, 15]
		env2 = new Warhammer({ gameSettings: { ...gameSettings, models: env2Models }, battlefields });
		optimizer = tf.train.adam(1e-3);
	});

	beforeEach(() => {
		env.reset();
		env2.reset();
	});

	it('order', () => {
		const player = new PlayerEnvironment(0, env);
		const gameAgent = new GameAgent(player, { nn });
		for(let i = 0; i<30; i++) {
			let action = null;
			player.step = (order) => {
				action = order.action;
				return [order, env.getState(), 0];
			};

			gameAgent.playStep();
			expect(action).toMatch(/NEXT_PHASE|SELECT$/);
		}
	});

	it('Next phase state before enemy turn to b eNext phase state with reward after enemy turn ', () => {
		const replayMemory = new ReplayMemory(1);
		const players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)]
		const controlledAgent = [new ControlledAgent(players[0], { replayMemory }), new ControlledAgent(players[1])];
		for (let player of [0, 1, 0]) {
			controlledAgent[player].playStep(0);
			controlledAgent[player].playStep(0);
		}
		expect(replayMemory.sample(1)[0][2]).toBe(11);
	});

	xit('train next on marker', () => {
		const replayMemory = new ReplayMemory(2);
		const players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)]
		const controlledAgent = [new ControlledAgent(players[0], { replayMemory }), new ControlledAgent(players[1])];
		controlledAgent[0].playStep(0);
		const inputAtTheEndPhase = getStateTensor([players[0].getInput()], 44, 30, players[0].channels);
		controlledAgent[0].playStep(0);
		controlledAgent[1].playStep(0);
		controlledAgent[1].playStep(0);
		const input = getStateTensor([players[0].getInput()], 44, 30, players[0].channels); /* state */
		controlledAgent[0].playStep(0);
		controlledAgent[0].playStep(0); /* save to replay memory reward with 11 */

		//console.log(replayMemory.sample(1))
		const gameAgent = new GameAgent(players[0], { nn, replayMemory });
		const gamma = 0.99
		expect(Math.round(gameAgent.onlineNetwork.predict(inputAtTheEndPhase).dataSync()[0])).not.toBe(10, 12);
		expect(Math.round(gameAgent.onlineNetwork.predict(input).dataSync()[0])).not.toBe(10, 12);
		for (let i = 0; i <= 10000; i++) {
			console.log('****', i)
			console.log(gameAgent.onlineNetwork.predict(inputAtTheEndPhase).dataSync()[0]);
			console.log(gameAgent.onlineNetwork.predict(input).dataSync()[0]);
			gameAgent.trainOnReplayBatch(2,gamma, optimizer);
			if(i % 100 === 30) {
				copyWeights(gameAgent.targetNetwork, gameAgent.onlineNetwork);
			}
		}

		console.log(Math.round(gameAgent.onlineNetwork.predict(inputAtTheEndPhase).dataSync()[0]));
		expect(Math.round(gameAgent.onlineNetwork.predict(inputAtTheEndPhase).dataSync()[0])).toBe(1 + 11 * gamma);
		expect(Math.round(gameAgent.onlineNetwork.predict(input).dataSync()[0])).toBe(11);
	});

	xit('train move to marker', () => {
		const replayMemory = new ReplayMemory(4);
		const players = [new PlayerEnvironment(0, env2), new PlayerEnvironment(1, env2)]
		const controlledAgent = [new ControlledAgent(players[0], { replayMemory }), new ControlledAgent(players[1])];
		controlledAgent[0].playStep(1);
		const inputBeforeMove = getStateTensor([players[0].getInput()], 44, 30, players[0].channels);
		controlledAgent[0].playStep(29);
		controlledAgent[0].playStep(0);
		//console.log(replayMemory.buffer[0][0])
		controlledAgent[0].playStep(0);
		controlledAgent[1].playStep(0);
		controlledAgent[1].playStep(0);
		console.log(players[0].getInput())
		controlledAgent[0].playStep(0);
		console.log(replayMemory.sample(1)[0][0])
		
		const inputAtTheEndPhase = getStateTensor([replayMemory.sample(1)[0][0]], 44, 30, players[0].channels);

		controlledAgent[0].playStep(0);
		//console.log(replayMemory.length)
		//console.log(replayMemory.sample(4))


		const gameAgent = new GameAgent(players[0], { nn, replayMemory });
		//gameAgent.trainOnReplayBatch(batchSize, gamma, optimizer);


		const input = getStateTensor([replayMemory.sample(1)[0][0]], 44, 30, players[0].channels);
		expect(gameAgent.onlineNetwork.predict(inputAtTheEndPhase).argMax(-1).dataSync()[0]).toBe(26);
		expect(gameAgent.onlineNetwork.predict(input).argMax(-1).dataSync()[0]).toBe(26);

		gameAgent.trainOnReplayBatch(3, 0.99, optimizer);
		expect(gameAgent.onlineNetwork.predict(inputAtTheEndPhase).argMax(-1).dataSync()[0]).toBe(0);
		expect(gameAgent.onlineNetwork.predict(input).argMax(-1).dataSync()[0]).toBe(0);
	});
});

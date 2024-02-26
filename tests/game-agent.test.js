import tf from '@tensorflow/tfjs-node';
import { Warhammer } from '../static/environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';
import { GameAgent } from '../agents/game-agent0.1.js';
import { fillReplayMemory } from '../environment/fill-replay-memory.js';
import { ReplayMemory } from '../replay-memory/replay-memory.js';
import { ControlledAgent } from '../agents/controlled-agent.js';
import { getStateTensor } from '../static/utils/get-state-tensor.js';
import { copyWeights } from '../dqn/dqn.js';

import battlefields from './mock/battlefields.json' assert { type: 'json' };
import gameSettings from './mock/game-settings.json' assert { type: 'json' };

const fileName = `file://tests/mock/dqn-test22x15/model.json`;
describe('game agent', () => {
	const nn = [];
	let env = null;
	let env2 = null
	let player = null;
	let gameAgent = null;
	let optimizer = null;
	beforeAll(async () => {
		nn[0] = await tf.loadLayersModel(fileName);
		nn[1] = await tf.loadLayersModel(fileName);
		env = new Warhammer({ gameSettings, battlefields });
		const env2Models = [...gameSettings.models];
		env2Models[0] = [5, 5]
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
		let action = null;
		const step_ = player.step
		player.step = (order) => {
			action = order.action;
			return step_.call(player, order);
		};

		gameAgent.playStep();
		expect(action).toMatch(/NEXT_PHASE|MOVE|SHOOT$/);
	});

	it('Next phase state before enemy turn to b eNext phase state with reward after enemy turn ', () => {
		const replayMemory = new ReplayMemory(1);
		const players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)]
		const controlledAgent = [new ControlledAgent(players[0], { replayMemory }), new ControlledAgent(players[1])];

		for (let player of [0, 1, 0, 1, 0]) {
			controlledAgent[player].playStep(0);
		}
		expect(replayMemory.sample(1)[0][2]).toBe(4.9);
	});

	xit('train next on marker', () => {
		const replayMemory = new ReplayMemory(2);
		const players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)]
		const controlledAgent = [new ControlledAgent(players[0], { replayMemory }), new ControlledAgent(players[1])];
		const gameAgent = new GameAgent(players[0], { nn, replayMemory });
		let input = getStateTensor([players[0].getInput()], 22, 15, players[0].channels);
		expect(gameAgent.onlineNetwork.predict(input).argMax(-1).dataSync()[0]).not.toBe(0);
		[1,2,3].forEach(() => {
			controlledAgent[0].playStep(0);
			controlledAgent[1].playStep(0);
		});

		const gamma = 0.99;
		for (let i = 0; i <= 15; i++) {
			gameAgent.trainOnReplayBatch(2, gamma, optimizer);
			if(i % 100 === 5) {
				copyWeights(gameAgent.targetNetwork, gameAgent.onlineNetwork);
			}
		}

		expect(gameAgent.onlineNetwork.predict(input).argMax(-1).dataSync()[0]).toBe(0);
	});

	xit('train move to marker', () => {
		const replayMemory = new ReplayMemory(5);
		const players = [new PlayerEnvironment(0, env2), new PlayerEnvironment(1, env2)]
		const controlledAgent = [new ControlledAgent(players[0], { replayMemory }), new ControlledAgent(players[1])];
		const gameAgent = new GameAgent(players[0], { nn, replayMemory });
		let input = getStateTensor([players[0].getInput()], 22, 15, players[0].channels);

		/*
			Write Next phase with small reward
		*/
		[1,2,3].forEach(() => {
			controlledAgent[0].playStep(0);
			controlledAgent[1].playStep(0);
		});

		env2.reset();
		controlledAgent.forEach(a => a.reset());

		/*
			Move to marker
		*/
		controlledAgent[0].playStep(28);
		controlledAgent[0].playStep(0);
		controlledAgent[1].playStep(0);
		let input2 = getStateTensor([players[0].getInput()], 22, 15, players[0].channels);
		[1,2].forEach(() => {
			controlledAgent[0].playStep(0);
			controlledAgent[1].playStep(0);
		});

		/*
			Train
		*/
		const gamma = 0.99;
		for (let i = 0; i <= 1000; i++) {
			gameAgent.trainOnReplayBatch(2, gamma, optimizer);
			if(i % 100 === 5) {
				copyWeights(gameAgent.targetNetwork, gameAgent.onlineNetwork);
			}
		}

		env2.reset();
		controlledAgent.forEach(a => a.reset());
		expect(gameAgent.onlineNetwork.predict(input).argMax(-1).dataSync()[0]).toBe(28);
		expect(gameAgent.onlineNetwork.predict(input2).argMax(-1).dataSync()[0]).toBe(0);
	});
});

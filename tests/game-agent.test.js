import tf from '@tensorflow/tfjs-node';
import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';
import { GameAgent } from '../agents/game-agent0.1.js';
import { ReplayMemoryByAction } from '../environment/replay-memory-by-action.js';
import { fillReplayMemory } from '../environment/fill-replay-memory.js';
import { ReplayMemory } from '../dqn/replay_memory.js';
import { ControlledAgent } from '../agents/controlled-agent.js';

import battlefields from './mock/battlefields.json' assert { type: 'json' };
import gameSettings from './mock/game-settings.json' assert { type: 'json' };

describe('game agent', () => {
	const nn = [];
	let env = null
	let player = null;
	let gameAgent = null;
	let optimizer = null;
	beforeAll(async () => {
		nn[0] = await tf.loadLayersModel(`file://tests/mock/dqn-test/model.json`);
		nn[1] = await tf.loadLayersModel(`file://tests/mock/dqn-test/model.json`);
		env = new Warhammer({ gameSettings, battlefields });
		optimizer = tf.train.adam(1e-3);
	});

	beforeEach(() => {
		env.reset();;
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
		controlledAgent[0].playStep(0);
		controlledAgent[0].playStep(0);
		controlledAgent[1].playStep(0);
		controlledAgent[1].playStep(0);
		controlledAgent[0].playStep(0);
		controlledAgent[0].playStep(0);
		expect(replayMemory.sample(1)[0][2]).toBe(10);
	})
});
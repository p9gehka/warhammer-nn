import tf from '@tensorflow/tfjs-node';
import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';
import { TestAgent } from '../agents/test-agent.js';
import { ReplayMemoryByAction } from '../environment/replay-memory-by-action.js';
import { fillReplayMemory } from '../environment/fill-replay-memory.js';
import { ReplayMemory } from '../dqn/replay_memory.js';
import { ControlledAgent } from '../agents/controlled-agent.js';
import { getStateTensor } from '../agents/utils.js';
import { copyWeights } from '../dqn/dqn.js';

import battlefields from './mock/battlefields.json' assert { type: 'json' };
import gameSettings from './mock/game-settings.json' assert { type: 'json' };

describe('test agent', () => {
	const nn = [];
	let env = null;
	let env2 = null
	let player = null;
	let optimizer = null;
	beforeAll(async () => {
		nn[0] = await tf.loadLayersModel(`file://tests/mock/dqn-test22x15/model.json`);
		nn[1] = await tf.loadLayersModel(`file://tests/mock/dqn-test22x15/model.json`);
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
		const testAgent = new TestAgent(player, { nn });
		let action = null;
		const step_ = player.step
		player.step = (order) => {
			action = order.action;
			return step_.call(player, order);
		};

		testAgent.playStep();
		expect(action).toMatch(/NEXT_PHASE|SELECT|MOVE|SHOOT$/);
	});

});

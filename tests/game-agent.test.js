import tf from '@tensorflow/tfjs-node';
import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';
import { GameAgent } from '../agents/game-agent0.1.js';

describe('game agent', () => {
	it('order', async () => {
		const nn = [];
		nn[0] = await tf.loadLayersModel(`file://tests/mock/dqn-test/model.json`);
		nn[1] = await tf.loadLayersModel(`file://tests/mock/dqn-test/model.json`);

		for(let i = 0; i<30; i++) {
			const env = new Warhammer();
			const player = new PlayerEnvironment(0, env);
			const gameAgent = new GameAgent(player, { nn });
			let action = null;
			player.step = (order) => {
				action = order.action;
				return [order, env.getState(), 0];
			};

			gameAgent.playStep();
			expect(action).toMatch(/NEXT_PHASE|SELECT$/);
		}
	});
});
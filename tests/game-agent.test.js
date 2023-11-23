import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';
import { GameAgent } from '../agents/game-agent0.1.js';

describe('game agent', () => {
	it('order', () => {
		for(let i = 0; i<1; i++) {
			const env = new Warhammer();
			const player = new PlayerEnvironment(0, env);
			const gameAgent = new GameAgent(player);
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
import { fillReplayMemory } from '../environment/fill-replay-memory.js';
import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';
import { ReplayMemoryByAction } from '../environment/replay-memory-by-action.js';

describe('replayMemoryByAction', () => {
	it('memory type', async () => {
		const env = new Warhammer();
		const player = new PlayerEnvironment(0, env);
		const replayMemory = new ReplayMemoryByAction(player, 100);

		fillReplayMemory(env, replayMemory);

		const orders = replayMemory.sample(20).map(([_,orderIndex]) => player.orders.all[orderIndex].action);
		expect(orders.length).toBe(20);
		expect(orders).toContain('NEXT_PHASE');
		expect(orders).toContain('SELECT');
		expect(orders).toContain('MOVE');
		expect(orders).toContain('SHOOT');
	});
});
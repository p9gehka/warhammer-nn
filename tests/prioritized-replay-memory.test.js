import { PrioritizedReplayMemory } from '../replay-memory/prioritized-replay-memory.js';
<<<<<<< HEAD
=======
import config from '../config.json' assert { type: 'json' };

const { replayBufferSize } = config;
>>>>>>> parent of f1272d5 (Unique play agent client memory)

describe('prioritized-replay-memory', () => {
	const memoryLength = 10;
	it('append', () => {
		const memory = new PrioritizedReplayMemory(memoryLength);
		memory.append('data1', 50)
		memory.append('data2', 100)
		memory.append('data3', 150)
		expect(memory.buffer).toEqual(['data1', 'data2','data3', null, null, null, null, null, null, null]);
		expect(memory.sumTree.getPriorities()).toEqual([200, 50, 50, 0, 0, 0, 0, 0, 0, 0]);

	});

	it('default priorities', () => {
		const memory = new PrioritizedReplayMemory(memoryLength);
		memory.append('data1')
		memory.append('data2')
		memory.append('data3')
		expect(memory.sumTree.getPriorities()).toEqual([10000, 10000, 10000, 0, 0, 0, 0, 0, 0, 0]);
	});
});

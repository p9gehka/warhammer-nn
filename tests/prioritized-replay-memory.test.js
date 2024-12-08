import { PrioritizedReplayMemory } from '../replay-memory/prioritized-replay-memory.js';

describe('prioritized-replay-memory', () => {
	const memoryLength = 10;
	it('append', () => {
		const memory = new PrioritizedReplayMemory(memoryLength);
		memory.append('data1', 200)
		memory.append('data2', 50)
		memory.append('data3', 50)
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

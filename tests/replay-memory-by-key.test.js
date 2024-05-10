import { ReplayMemory } from '../replay-memory/replay-memory-by-key.js';

describe('replay-memory-by-key', () => {
	it('append', () => {
		let memoryLength = 3;
		let memory = new ReplayMemory(memoryLength);
		memory.append('data1', 'key1')
		memory.append('data2', 'key2')
		memory.append('data3', 'key1')
		expect(memory.getAll()).toEqual(['data3', 'data2', 'data3']);
	});
});

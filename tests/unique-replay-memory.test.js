import { UniqueReplayMemory } from '../replay-memory/unique-replay-memory.js';

describe('prioritized-replay-memory', () => {
	const memoryLength = 3;
	it('append', () => {
		const memory = new UniqueReplayMemory(memoryLength);
		memory.append('data1', 'key1');
		memory.append('data2', 'key2');
		memory.append('data3', 'key3');
		memory.append('data3', 'key3');
		memory.append('data4', 'key4');
		console.log(memory)
		expect(memory.buffer).toEqual(['data1', 'data2','data3', null, null, null, null, null, null, null]);
	});
});

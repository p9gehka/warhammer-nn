import { PrioritizedReplayMemory } from '../replay-memory/prioritized-replay-memory.js';
import config from '../config.json' assert { type: 'json' };

const { replayBufferSize } = config;

describe('prioritized-replay-memory', () => {
	const memoryLength = 10;
	it('append', () => {
		const memory = new PrioritizedReplayMemory(memoryLength);
		memory.append('data1', 50)
		memory.append('data2', 100)
		memory.append('data3', 150)
		expect(memory.buffer).toEqual(['data1', 'data2','data3', null, null, null, null, null, null, null]);
		expect(memory.sumTree.getPriorities()).toEqual([50, 100, 150, 0, 0, 0, 0, 0, 0, 0]);

	});

	it('default priorities', () => {
		const memory = new PrioritizedReplayMemory(memoryLength);
		memory.append('data1')
		memory.append('data2')
		memory.append('data3')
		expect(memory.sumTree.getPriorities()).toEqual([10000, 10000, 10000, 0, 0, 0, 0, 0, 0, 0]);
	});

	it('update priorities', () => {
		const memory = new PrioritizedReplayMemory(memoryLength);
		memory.append('data1')
		memory.append('data2')
		memory.append('data3')

		memory.updatePriorities([0, 1, 2], [50, 100, 150])
		expect(memory.sumTree.getPriorities()).toEqual([50, 100, 150, 0, 0, 0, 0, 0, 0, 0]);
	});

	fit('update priorities by training', () => {
		const memory = new PrioritizedReplayMemory(replayBufferSize);
		const datas = []
		for (let i = 0; i < replayBufferSize; i++) {
			datas.push(`d${i}`);
		}
		memory.appendList(datas)
		console.log(memory.sumTree.getPriorities())
	});
});

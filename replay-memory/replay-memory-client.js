import { UniqueReplayMemory } from './unique-replay-memory.js';
import { PrioritizedReplayMemory } from './prioritized-replay-memory.js';
import config from '../config.json' assert { type: 'json' };

const serverAddress = '127.0.0.1:3000';

export class ReplayMemoryClient {
	constructor(maxLen, prioritized) {
		this.memory = prioritized ? new PrioritizedReplayMemory(maxLen) : new UniqueReplayMemory(maxLen);
		this.length = 0;
		this.maxLen = this.memory.maxLen;
	}
	append(item, properties) {
		this.memory.append(item, properties);
		this.length = this.memory.length;
	}
	sample(batchSize) {
		return this.memory.sample(batchSize);
	}
	clean() {
		this.memory.clean();
		this.length = 0;
	}
	updatePriorities(...args) {
		this.memory.updatePriorities(...args);
	}
	async updateServer() {
		while(true) {
			try {
				console.log('Try update server')
				const response = await fetch(`${config.memoryAddress}/append`, {
					method: 'POST',
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ buffer: this.memory.buffer }),
				});
				if (response.status !== 200) {
					console.log('Bad response');
				} else {
					console.log('Update success')
					return;
				}
			} catch (e) {
				console.log(e.message);
			}
		}
	}

	async updateClient() {
		try {
			const response = await fetch(`${config.memoryAddress}/sample?batchSize=${this.maxLen}`, {
				method: 'GET',
				headers: { "Content-Type": "application/json" },
			});
			if (response.status !== 200) {
				throw Error('bad response');
			}
			const data = await response.json()
			if (data.buffer.length === this.maxLen) {
				this.memory.buffer = data.buffer;
				this.length = this.maxLen;
			}
		} catch (e) {
			console.log('updateClient', e.message);
		}
	}
}

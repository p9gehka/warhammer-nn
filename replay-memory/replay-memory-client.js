import { ReplayMemory } from './replay-memory.js';
import { PrioritizedReplayMemory } from './prioritized-replay-memory.js';
import config from '../config.json' assert { type: 'json' };

const serverAddress = '127.0.0.1:3000';

export class ReplayMemoryClient {
	constructor(maxLen, prioritized) {
		this.memory = prioritized ? new PrioritizedReplayMemory(maxLen) : new ReplayMemory(maxLen);
		this.length = 0;
		this.maxLen = this.memory.maxLen;
		if (prioritized) {
			this.type = 'prioritized';
		}
	}
	append(item, priority) {
		this.memory.append(item, priority);
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
		if (this.memory.updatePriorities) {
			this.memory.updatePriorities(...args);
		}
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
		console.log('Try update client')
		try {
			const batchSize = this.memory.length === this.maxLen ? Math.round(this.maxLen / 2) : this.maxLen;
			const response = await fetch(`${config.memoryAddress}/sample?batchSize=${batchSize}`, {
				method: 'GET',
				headers: { "Content-Type": "application/json" },
			});
			if (response.status !== 200) {
				throw Error('bad response');
			}
			const data = await response.json();
			this.memory.appendList(...data.buffer);
			this.length = this.maxLen;
		} catch (e) {
			console.log('updateClient', e.message);
		}
	}
}

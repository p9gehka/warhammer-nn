import { ReplayMemory } from './replay-memory.js';

const serverAddress = '127.0.0.1:3030';
export class ReplayMemoryClient {
	constructor(maxLen) {
		this.memory = new ReplayMemory(maxLen);
		this.length = 0;
		this.maxLen = maxLen;
	}
	append(item) {
		this.memory.append(item);
		this.length = this.memory.length;
	}
	sample(batchSize) {
		return this.memory.sample(batchSize);
	}

	async updateServer() {
		const response = await fetch('http://${serverAddress}/append', {
			method: 'POST',
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ memory: this.memory }),
		});
	}

	async updateClient() {
		const response = await fetch('http://${serverAddress}/sample', {
			method: 'GET',
			headers: { "Content-Type": "application/json" },
		});
		this.memory = response.json();
	}
}

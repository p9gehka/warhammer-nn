import { getTF } from '../static/utils/get-tf.js';

const tf = await getTF();

class SumTree {
	constructor(levels) {
		this.levels = []
		for (let i = 0; i < levels; i++) {
			this.levels.push(new Array(2 ** i).fill(10000 * (2 ** (levels - i - 1))))
		}
	}
	setValue(index, value) {
		let cursor = index;
		for (let i = this.levels.length; i > 0; i--) {
			this.levels[i-1][cursor] = this.levels[i] !== undefined ? this.levels[i][cursor * 2] + this.levels[i][cursor * 2 + 1] : value;
			cursor = Math.floor(cursor/2);
		}
	}
	setValueLazy(index, value) {
		this.levels.at(-1)[index] = value;
	}
	recalculateTree() {
		for (let i = this.levels.length - 2; i >= 0; i--) {
			for (let cursor = 0; cursor < this.levels[i].length; cursor++) {
				this.levels[i][cursor] = this.levels[i+1][cursor * 2] + this.levels[i+1][cursor * 2 + 1];
			}
		}
	}
	getIndex(initialX) {
		let x = initialX;
		let index = 0;
		let i = 0;

		while (this.levels[i+1] !== undefined) {

			if (x <= this.levels[i+1][index * 2]) {
				index = index * 2
			} else {
				x = x - this.levels[i+1][index * 2];
				index = index * 2 + 1;
			}
			i++;
		}
		return index;
	}
}

/** Replay buffer for DQN training. */
export class PrioritizedReplayMemory {
	/**
	 * Constructor of ReplayMemory.
	 *
	 * @param {number} maxLen Maximal buffer length.
	 */
	constructor(maxLen) {
		const levels = Math.floor(Math.log2(maxLen));
		this.maxLen = 2 ** levels ;
		this.buffer = [];
		this.sumTree = new SumTree(levels);

		for (let i = 0; i < maxLen; ++i) {
			this.buffer.push(null);
		}
		this.index = 0;
		this.length = 0;

	}
	clean() {
		this.buffer = [];
		this.length = 0;
		this.index = 0;
	}
	/**
	 * Append an item to the replay buffer.
	 *
	 * @param {any} item The item to append.
	 */
	append(item) {
		this.buffer[this.index] = item;
		this.sumTree.setValue(this.index, 10000);
		this.length = Math.min(this.length + 1, this.maxLen);
		this.index = (this.index + 1) % this.maxLen;
	}

	/**
	 * Randomly sample a batch of items from the replay buffer.
	 *
	 * The sampling is done *without* replacement.
	 *
	 * @param {number} batchSize Size of the batch.
	 * @return {Array<any>} Sampled items.
	 */
	sample(batchSize) {
		if (batchSize > this.maxLen) {
			throw new Error(
					`batchSize (${batchSize}) exceeds buffer length (${this.maxLen})`);
		}

		const out = [];
		const indeces = [];
		for (let i = 0; i < batchSize; ++i) {
			const x = this.sumTree.levels[0][0] * Math.random();
			const index = this.sumTree.getIndex(x);
			indeces.push(index);
			out.push(this.buffer[index]);
		}
		return [out, indeces];
	}
	updatePriorities(indeces, priorities) {
		for(let i = 0; i < indeces.length; i++) {
			this.sumTree.setValueLazy(indeces[i], priorities[i]);
		}
		recalculateTree();
	}
}


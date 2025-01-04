import { getTF } from '../static/utils/get-tf.js';

const tf = await getTF();


class SumTree {
	MAX_PRIORITY = 10000;
	MIN_PRIORITY = 0;
	constructor(maxLen) {
		this.maxLen = maxLen;
		const levels = Math.ceil(Math.log2(maxLen));
		this.levels = [];

		for (let i = 0; i < (levels + 1); i++) {
			const level = new Array(2 ** i).fill(this.MIN_PRIORITY * (2 ** (levels - i)));
			this.levels.push(level);
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
	argMin() {
		return this.levels.at(-1).map((x, i) => [x, i]).reduce((r, a) => (a[0] < r[0] ? a : r))[1];
	}
	findNSmallestIndexes(n) {
		const x = (this.levels[0][0] / this.maxLen) * (this.maxLen / n) ;
		const lastLevel = this.levels.at(-1);
		const indexes = [];
		for (let i = 0; i < this.maxLen; i++) {
			if (lastLevel[i] <= x) {
				indexes.push(i);
			}
		}
		return indexes;
	}
	getPriorities() {
		return this.levels.at(-1).slice(0, this.maxLen);
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
		this.maxLen = maxLen;
		this.buffer = [];
		this.sumTree = new SumTree(maxLen);
		this.priorities = this.sumTree.levels.at(-1);
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
	append(item, priority = this.sumTree.MAX_PRIORITY) {
		const index = this.sumTree.argMin();
		this.buffer[index] = item;
		this.sumTree.setValue(index, priority);
		this.length = Math.min(this.length + 1, this.maxLen);
	}
	appendList(items, priorities = []) {
		const indexes = this.sumTree.findNSmallestIndexes(items.length);

		for(let i = 0; i < items.length; i++) {
			const index = indexes[i];
			this.buffer[this.index] = items[i];
			this.sumTree.setValueLazy(index, priorities[i] ?? this.sumTree.MAX_PRIORITY);
		}
		this.length = Math.min(this.length + items.length, this.maxLen);
		this.sumTree.recalculateTree();
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
		const out = [];
		const indeces = [];
		const outPriorities = [];
		const priorities = this.sumTree.levels.at(-1);
		for (let i = 0; i < batchSize; ++i) {
			const x = this.sumTree.levels[0][0] * Math.random();
			const index = this.sumTree.getIndex(x);
			indeces.push(index);
			out.push(this.buffer[index]);
			outPriorities.push(priorities[index])
		}

		return [out, indeces, outPriorities];
	}
	updatePriorities(indeces, priorities = []) {
		for(let i = 0; i < indeces.length; i++) {
			this.sumTree.setValueLazy(indeces[i], priorities[i] ?? 10000);
		}
		this.sumTree.recalculateTree();
	}
}

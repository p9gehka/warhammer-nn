import { getTF } from '../static/utils/get-tf.js';

const tf = await getTF();

/** Replay buffer for DQN training. */
export class UniqueReplayMemory {
	/**
	 * Constructor of ReplayMemory.
	 *
	 * @param {number} maxLen Maximal buffer length.
	 */
	constructor(maxLen) {
		this.maxLen = maxLen;
		this.buffer = [];
		for (let i = 0; i < maxLen; ++i) {
			this.buffer.push(null);
		}
		this.index = 0;
		this.length = 0;

		this.bufferIndices_ = [];
		this.keyToIndex = {};
		this.indexToKey = [];
		for (let i = 0; i < maxLen; ++i) {
			this.bufferIndices_.push(i);
		}
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
	append(item, { key }) {
		if (this.keyToIndex[key] !== undefined) {
			return;
		} else {
			delete this.keyToIndex[this.indexToKey[this.index]];
		}
		this.keyToIndex[key] = this.index;
		this.indexToKey[this.index] = key;
		this.buffer[this.index] = item;
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

		tf.util.shuffle(this.bufferIndices_);

		const out = [];
		for (let i = 0; i < batchSize; ++i) {
			out.push(this.buffer[this.bufferIndices_[i]]);
		}
		return out;
	}
}

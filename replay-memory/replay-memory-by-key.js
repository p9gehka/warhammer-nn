import { getTF } from '../dqn/utils.js';

const tf = await getTF();

/** Replay buffer for DQN training. */
export class ReplayMemory {
  /**
   * Constructor of ReplayMemory.
   *
   * @param {number} maxLen Maximal buffer length.
   */
  constructor(maxLen) {
    this.maxLen = maxLen;
    this.buffer = [];
    this.heap = {};
    this.keyCounter = {};
    for (let i = 0; i < maxLen; ++i) {
      this.buffer.push(null);
    }
    this.index = 0;
    this.length = 0;

    this.bufferIndices_ = [];
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
  append(item, key) {
    const indexHash = this.buffer[this.index];
    this.keyCounter[indexHash]--;
    if (this.keyCounter[indexHash] === 0) {
       delete this.keyCounter[indexHash];
       delete this.heap[indexHash];
    }

    if (this.heap[key] === undefined) {
      this.keyCounter[key] = 0;
    }

    this.keyCounter[key]++;
    this.heap[key] = item;

    this.buffer[this.index] = key;
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
      out.push(this.heap[this.buffer[this.bufferIndices_[i]]]);
    }
    return out;
  }
}

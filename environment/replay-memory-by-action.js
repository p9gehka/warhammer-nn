import { ReplayMemory } from '../dqn/replay_memory.js';
import { Action } from './player-environment.js';

export class ReplayMemoryByAction {
  constructor(game, maxLen) {
    this.game = game;
    this.actionsValues = Object.values(Action);
    this.maxLen = maxLen;
    this.length = 0;
    for(let action of this.actionsValues) {
      this[action] = new ReplayMemory(this.maxLen / this.actionsValues.length);
    }
  }

  append(item) {
    const action = this.game.orders.all[item[1]].action;
    this[action].append(item)
    let newLength = 0;

    for(let action of this.actionsValues) {
      newLength += this[action].length;
    }

    this.length = newLength;
  }

  sample(batchSize) {
    const miniBatchSize = batchSize / this.actionsValues.length;
    const out = [];

    for(let action of this.actionsValues) {
       out.push(...this[action].sample(miniBatchSize));
    }
    this.shuffleArray(out);
    return out;
  }
  shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }
}
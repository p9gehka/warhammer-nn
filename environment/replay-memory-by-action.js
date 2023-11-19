import { ReplayMemory } from '../dqn/replay_memory.js';
import { Action } from './player-environment.js';

export class ReplayMemoryByAction {
  constructor(game, maxLen) {
    this.game = game;
    this.actionsValues = Object.values(Action);
    this.maxLen = Math.round(maxLen / this.actionsValues.length);
    this.length = 0;
    for(let action of this.actionsValues) {
      this[action] = new ReplayMemory(this.maxLen);
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

    return out;
  }
}
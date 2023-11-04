import * as tf from '@tensorflow/tfjs';

import { createDeepQNetwork } from '../dqn/dqn.js';
import { getRandomInteger } from '../static/utils//index.js';
import { getActions } from './utils.js';

export function getStateTensor(state, h, w, c) {
  const numExamples = state.length;

  let buffer = tf.buffer([numExamples, h, w, c]);

  for (let n = 0; n < numExamples; ++n) {
    if (state[n] == null) {
      continue;
    } 

    state[n].forEach((row, x) => {
      row.forEach((cell, y) => {
        if (cell !== 0) {
             buffer.set(cell, n, y, x, 0);
        }
      })
    })
  
  }

  return buffer.toTensor();
}


export class GameAgent {
  actions = [];
  channels = 1;
  constructor(game, numActions) {
    this.game = game;
    this.actions = getActions();
    this.onlineNetwork = createDeepQNetwork(game.height, game.width, this.channels, this.actions.length);
  }

  playStep() {
    this.epsilon = 0.9;
    
    const state = this.game.getInput44x30();
    let order;

    if (Math.random() < this.epsilon) {
      order = this.actions[getRandomInteger(0, this.actions.length)];
    } else {
      tf.tidy(() => {
        const stateTensor = getStateTensor([state], this.game.height, this.game.width, this.channels);
        order = this.actions[this.onlineNetwork.predict(stateTensor).argMax(-1).dataSync()[0]];
      });
    }
   return this.game.step(order);
  }
}

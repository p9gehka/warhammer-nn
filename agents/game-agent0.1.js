import * as tf from '@tensorflow/tfjs-node';

import { createDeepQNetwork } from '../dqn/dqn.js';
import { getRandomInteger } from '../static/utils//index.js';
import { getOrders } from './utils.js';
import { Action, Phase } from '../environment/warhammer.js';

export function getStateTensor(state, h, w, c) {
  const numExamples = state.length;
  let buffer = tf.buffer([numExamples, h, w, c]);

  for (let n = 0; n < numExamples; ++n) {
    if (state[n] == null) {
      continue;
    }

    for (let entity in state[n]) {
      const enitities = state[n][entity].forEach(yx => {
        buffer.set(entity, n, yx[0], yx[1], 0);
      })
    }
  }
  return buffer.toTensor();
}

const F = 50;

export class GameAgent {
  orders = [];
  channels = 1;
  attempts = 0;
  constructor(game, replayMemory) {
    this.game = game;
    this.orders = getOrders();
    this.onlineNetwork = createDeepQNetwork(game.height, game.width, this.channels, this.orders.length);
    this.replayMemory = replayMemory;
  }

  playStep() {
    this.epsilon = 0.5;

    const input = this.game.getInput();
    const currentPhase = this.game.env.phase;


    let epsilon = this.epsilon;
    let order = { action: Action.NextPhase };
    let orderIndex;

    for (let i = 0; i <= F; i++) {
      this.attempts++;
      if (Math.random() < this.epsilon) {
        orderIndex = getRandomInteger(0, this.orders.length);
      } else {
        tf.tidy(() => {
          const inputTensor = getStateTensor([input], this.game.height, this.game.width, this.channels);
          orderIndex = this.onlineNetwork.predict(inputTensor).argMax(-1).dataSync()[0]
        });
      }

      order = this.orders[orderIndex];

      if (currentPhase === Phase.Movement && order.action === Action.Move) {
        break
      }

      if (currentPhase === Phase.Shooting && order.action === Action.Shoot) {
        break
      }
      if (order.action === Action.NextPhase) {
        break;
      }
      epsilon = 0.9;

      if (i === F) {
        order = { action: Action.NextPhase };
      }
    }



   const [state, order_, reward] = this.game.step(order);
   const nextInput = this.game.getInput();

   this.replayMemory.append([input, orderIndex, reward, state.done, nextInput]);
   return [state, order_, reward]
  }
}

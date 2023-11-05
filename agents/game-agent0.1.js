import * as tf from '@tensorflow/tfjs-node';

import { createDeepQNetwork } from '../dqn/dqn.js';
import { getRandomInteger } from '../static/utils//index.js';
import { getOrders, getStateTensor } from './utils.js';
import { Phase } from '../environment/warhammer.js';
import { Action, Channel2Name, Channel1Name  } from '../environment/player-environment.js';

export class GameAgent {
  orders = [];
  attempts = 0;
  pevOrderIndex = null;
  constructor(game, replayMemory) {
    this.game = game;
    this.orders = getOrders();
    this.onlineNetwork = createDeepQNetwork(game.height, game.width, game.channels, this.orders.all.length);
    this.replayMemory = replayMemory;
  }
  reset() {
    this.attempts = 0;
  }

  getOrderRandomIndex() {
    const input = this.game.getInput();
    if (input[Channel2Name.Selected].length === 0) {
      return this.orders.selectIndexes[getRandomInteger(0, this.orders.selectIndexes.length)];
    }
    if (input[Channel1Name.SelfStrikeTeamAvailableToMove].length !== 0 || input[Channel1Name.SelfStealthAvailableToMove].length !== 0) {
      return this.orders.selectAndMoveIndexes[getRandomInteger(0, this.orders.selectAndMoveIndexes.length)];
    }

    if (input[Channel1Name.SelfStrikeTeamAvailableToShoot].length !== 0 || input[Channel1Name.SelfStealthAvailableToShoot].length !== 0) {
      return this.orders.selectAndShootIndexes[getRandomInteger(0, this.orders.selectAndShootIndexes.length)];
    }

    return this.orders.nextPhaseIndex;
  }
  getAvailableIndexes() {
    const input = this.game.getInput();

    if (input[Channel2Name.Selected].length === 0) {
      return this.orders.selectIndexesArgMax;
    }
    if (input[Channel1Name.SelfStrikeTeamAvailableToMove].length !== 0 || input[Channel1Name.SelfStealthAvailableToMove].length !== 0) {
      return this.orders.selectAndMoveIndexesArgMax;
    }

    if (input[Channel1Name.SelfStrikeTeamAvailableToShoot].length !== 0 || input[Channel1Name.SelfStealthAvailableToShoot].length !== 0) {
       return this.orders.selectAndShootIndexesArgMax;
    }

    return this.orders.nextPhaseIndexesArgMax;
  }

  playStep() {
    this.epsilon = 0.5;

    const input = this.game.getInput();
    let epsilon = this.epsilon;
    let order = this.orders[Action.NextPhase][0];
    let orderIndex;

    this.attempts++;
    if (Math.random() < this.epsilon) {
      orderIndex = this.getOrderRandomIndex();
    } else {
      tf.tidy(() => {
        const inputTensor = getStateTensor([input], this.game.height, this.game.width, this.game.channels);
        const availableIndexes = this.getAvailableIndexes();
        orderIndex = this.onlineNetwork.predict(inputTensor)
        orderIndex = tf.add(orderIndex, tf.tensor2d(availableIndexes, [1, 33])).argMax(-1).dataSync()[0]
      });
    }

    if (orderIndex !== this.orders.nextPhaseIndex && orderIndex === this.prevOrderIndex) {
       orderIndex = this.getOrderRandomIndex();
    }

    order = this.orders.all[orderIndex];

   this.prevOrderIndex = orderIndex;
   const [state, order_, reward] = this.game.step(order);
   const nextInput = this.game.getInput();

   this.replayMemory.append([input, orderIndex, reward, state.done, nextInput]);
   return [state, order_, reward]
  }
}

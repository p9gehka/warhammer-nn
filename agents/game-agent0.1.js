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
    this.targetNetwork = createDeepQNetwork(game.height, game.width, game.channels, this.orders.all.length);
    this.replayMemory = replayMemory;
    this.frameCount = 0;
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
    this.frameCount++;
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
   const [order_, state, reward] = this.game.step(order);
   const nextInput = this.game.getInput();
   this.replayMemory.append([input, orderIndex, reward, state.done, nextInput]);
   return [order_, state, reward]
  }



  trainOnReplayBatch(batchSize, gamma, optimizer) {
    // Get a batch of examples from the replay buffer.
    const batch = this.replayMemory.sample(batchSize);

    const lossFunction = () => tf.tidy(() => {
      const stateTensor = getStateTensor(batch.map(example => example[0]), this.game.height, this.game.width, this.game.channels);
      const actionTensor = tf.tensor1d(batch.map(example => example[1]), 'int32');

      const qs = this.onlineNetwork.apply(stateTensor, {training: true}).mul(tf.oneHot(actionTensor, this.orders.all.length)).sum(-1);

      const rewardTensor = tf.tensor1d(batch.map(example => example[2]));
      const nextStateTensor = getStateTensor(batch.map(example => example[4]), this.game.height, this.game.width, this.game.channels);

      const nextMaxQTensor = this.targetNetwork.predict(nextStateTensor).max(-1);
      const doneMask = tf.scalar(1).sub(
          tf.tensor1d(batch.map(example => example[3])).asType('float32'));
      const targetQs =
          rewardTensor.add(nextMaxQTensor.mul(doneMask).mul(gamma));
      return tf.losses.meanSquaredError(targetQs, qs);
    });

    // Calculate the gradients of the loss function with repsect to the weights
    // of the online DQN.
    const grads = tf.variableGrads(lossFunction);
    // Use the gradients to update the online DQN's weights.
    optimizer.applyGradients(grads.grads);
    tf.dispose(grads);
    // TODO(cais): Return the loss value here?
  }
}

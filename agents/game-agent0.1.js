import * as tf from '@tensorflow/tfjs';

import {createDeepQNetwork} from './dqn';
import {getRandomAction, SnakeGame, NUM_ACTIONS, ALL_ACTIONS, getStateTensor} from './snake_game';
import {ReplayMemory} from './replay_memory';
import { assertPositiveInteger } from './utils';

export class GameAgent {
  constructor(game) {
    this.game = game;
    this.onlineNetwork =
        createDeepQNetwork(game.height,  game.width, NUM_ACTIONS);
  }

  reset() {
    this.game.reset();
  }

  /**
   * Play one step of the game.
   *
   * @returns {number | null} If this step leads to the end of the game,
   *   the total reward from the game as a plain number. Else, `null`.
   */
  playStep() {
    this.epsilon = 0.5;
    let action;
    const state = this.game.getState();
    if (Math.random() < this.epsilon) {
      // Pick an action at random.
      action = getRandomAction();
    } else {
      // Greedily pick an action based on online DQN output.
      tf.tidy(() => {
        const stateTensor =getStateTensor(state, this.game.height, this.game.width)
        action = ALL_ACTIONS[this.onlineNetwork.predict(stateTensor).argMax(-1).dataSync()[0]];
      });
    }

    const {state: nextState, reward, done, fruitEaten} = this.game.step(action);

    const output = {
      action,
      cumulativeReward: this.cumulativeReward_,
      done,
      fruitsEaten: this.fruitsEaten_
    };

    return output;
  }
}

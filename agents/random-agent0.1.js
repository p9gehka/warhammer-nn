import { eq } from '../static/utils/vec2.js';
import { Channel3Name, Channel2Name, Channel1Name  } from '../environment/player-environment.js';

import { getRandomInteger } from '../static/utils/index.js';
import { Orders } from './utils.js';


export class RandomAgent {
	orders = []
	attempts = 0;
	constructor(game, config = {}) {
		const { replayMemory } = config;
		this.game = game;
		this.orders = (new Orders(game.env.players[this.game.playerId].models.length, this.game.env.players[this.game.enemyId].models.length)).getOrders();
		this.replayMemory = replayMemory;
	}
	reset() {
		this.attempts = 0;
	}
	getOrderIndex() {
		const input = this.game.getInput();
		const selected = xy => eq(xy, input[Channel3Name.Selected].at(0));

		if (input[Channel3Name.Selected].length === 0) {
			return this.orders.selectIndexes[getRandomInteger(0, this.orders.selectIndexes.length)];
		}

		if (input[Channel1Name.SelfModelAvailableToMove].some(selected)) {
			return this.orders.moveIndexes[getRandomInteger(0, this.orders.moveIndexes.length)];
		}

		if (input[Channel1Name.SelfModelAvailableToShoot].some(selected)) {
			return this.orders.shootIndexes[getRandomInteger(0, this.orders.shootIndexes.length)];
		}
		if (input[Channel1Name.SelfModelAvailableToMove].length === 0 && input[Channel1Name.SelfModelAvailableToShoot].length === 0) {
			return this.orders.nextPhaseIndex;
		}
		
		return this.orders.selectIndexes[getRandomInteger(1, this.orders.selectIndexes.length)];
	}

	playStep() {
		this.attempts++;
		const orderIndex = this.getOrderIndex();
		const order = this.orders.all[orderIndex];
		const input = this.game.getInput();
		const [order_, state, reward] = this.game.step(order);
		const nextInput = this.game.getInput();
		this.replayMemory?.append([input, orderIndex, reward, state.done, nextInput]);
		return [order_, state, reward];
	}

	trainOnReplayBatch() {}
}

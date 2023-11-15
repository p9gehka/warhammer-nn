import { eq } from '../static/utils/vec2.js';
import { Channel2Name, Channel1Name  } from '../environment/player-environment.js';

import { getRandomInteger } from '../static/utils/index.js';

export class RandomAgent {
	orders = []
	constructor(game, config = {}) {
		const { replayMemory, actionsProb } = config;
		this.actionsProb = actionsProb ?? {};
		this.game = game;
		this.replayMemory = replayMemory;
	}
	getOrderIndex() {
		const { orders } = this.game;
		const input = this.game.getInput();
		const selected = xy => eq(xy, input[Channel2Name.Selected].at(0));

		if (input[Channel2Name.Selected].length === 0) {
			return orders.selectIndexes[getRandomInteger(0, orders.selectIndexes.length)];
		}

		if (input[Channel1Name.SelfModelAvailableToMove].some(selected)) {
			return orders.moveIndexes[getRandomInteger(0, orders.moveIndexes.length)];
		}

		if (input[Channel1Name.SelfModelAvailableToShoot].some(selected)) {
			return orders.shootIndexes[getRandomInteger(0, orders.shootIndexes.length)];
		}
		if (input[Channel1Name.SelfModelAvailableToMove].length === 0 && input[Channel1Name.SelfModelAvailableToShoot].length === 0) {
			return orders.nextPhaseIndex;
		}
		
		return orders.selectIndexes[getRandomInteger(1, orders.selectIndexes.length)];
	}

	playStep() {
		const orderIndex = this.getOrderIndex();
		const order = this.game.orders.all[orderIndex];
		const input = this.game.getInput();
		const [order_, state, reward] = this.game.step(order);
		const nextInput = this.game.getInput();
		if (this.needSave(orderIndex)) {
			this.replayMemory?.append([input, orderIndex, reward, state.done, nextInput]);
		}
		return [order_, state, reward];
	}
	needSave(orderIndex) {
		if (orderIndex in this.actionsProb) {
			return this.actionsProb[orderIndex] > Math.random();
		}
		return true
	}
	trainOnReplayBatch() {}
}

import { eq } from '../static/utils/vec2.js';
import { Channel2Name, Channel1Name  } from '../environment/player-environment.js';

import { getRandomInteger } from '../static/utils/index.js';

export class RandomAgent {
	orders = []
	prevState = null;
	constructor(game, config = {}) {
		const { replayMemory } = config;
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
		if (this.prevState !== null) {
			this.replayMemory?.append([...this.prevState, false, input]);
		}
		const [order_, state, reward] = this.game.step(order);
		this.prevState = [input, orderIndex, reward]
		return [order_, state, reward];
	}
	awarding() {
		const reward = this.game.awarding();
		const nextInput = this.game.getInput();
		if (this.replayMemory !== null && this.prevState !== null) {
			const [input, orderIndex] = this.prevState;
			this.replayMemory?.append([input, orderIndex, reward, true, nextInput]);
		}
	}
	reset() {
		this.prevState = null;
		this.game.reset();
	}
	trainOnReplayBatch() {}
}

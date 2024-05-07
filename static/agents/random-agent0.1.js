import { Channel1Name } from '../environment/nn-input.js';
import { getRandomInteger } from '../utils/index.js';
import { Action } from '../environment/orders.js';

export class RandomAgent {
	orders = []
	prevState = null;
	constructor(game, config = {}) {
		const { replayMemory } = config;
		this.game = game;
		this.replayMemory = replayMemory;
	}

	getOrderRandomIndex() {
		return getRandomInteger(0, this.game.orders.all.length);
	}

	playStep() {
		const initState = this.game.env.getState();
		const { selected } = this.game.getState();
		const input = this.game.getInput();
		const { orders } = this.game;
		if (this.prevState !== null) {
			this.replayMemory?.append([...this.prevState, false, input]);
		}

		let orderIndex = this.getOrderRandomIndex();

		let [order_, state , reward] = this.game.step(orders.all[orderIndex]);

		this.prevState = [input, orderIndex, reward];
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

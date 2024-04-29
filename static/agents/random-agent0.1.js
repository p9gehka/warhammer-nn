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
		this.skipPhase = false
	}

	getOrderRandomIndex() {
		return getRandomInteger(0, this.game.orders.all.length);
	}

	playStep() {
		const initState = this.game.env.getState();
		const { selected } = this.game.getState();
		let orderIndex = this.getOrderRandomIndex();
		const input = this.game.getInput();
		const { orders } = this.game;
		if (this.prevState !== null) {
			this.replayMemory?.append([...this.prevState, false, input]);
		}

		if (this.skipPhase) {
			orderIndex = orders.moveIndexes[0];
			this.skipPhase = false;
		}

		let [order_, state , reward] = this.game.step(orders.all[orderIndex]);

		if (orderIndex === orders.moveIndexes[0]) {
			[, state,] = this.game.step({ action: Action.NextPhase });
			this.skipPhase = false;
		} else if (initState.modelsStamina[selected] === state.modelsStamina[selected]) {
			this.skipPhase = true;
		}

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
		this.skipPhase = false
		this.prevState = null;
		this.game.reset();
	}
	trainOnReplayBatch() {}
}

import { Action } from '../environment/orders.js';

export class ControlledAgent {
	prevState = null;
	constructor(game, config = {}) {
		this.game = game;
		const { replayMemory } = config;
		this.replayMemory = replayMemory ?? null;
	}

	playStep(orderIndex) {
		const input = this.game.getInput();
		const orders = this.game.orders.all;
		if (this.replayMemory !== null && this.prevState !== null) {
			this.replayMemory?.append([...this.prevState, false, input]);
		}

		const order = orders.all[orderIndex];
		let [order_, state ,reward] = this.game.step(order);

		if (order.action === Action.NextPhase) {
			reward += this.game.primaryReward();
		}
		return [order_, state, reward];
	}

	nextPhaseWorkaround() {
		const input = this.game.getInput();
		const [order_, state, reward] = this.game.step({ action: Action.NextPhase });
	
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
}

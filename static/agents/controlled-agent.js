import { Action } from '../environment/orders.js';

export class ControlledAgent {
	prevState = null;
	constructor(game, config = {}) {
		this.game = game;
		const { replayMemory } = config;
		this.replayMemory = replayMemory ?? null;
		this.skipPhase = false;
	}

	playStep(orderIndex) {
		const input = this.game.getInput();
		if (this.replayMemory !== null && this.prevState !== null) {
			this.replayMemory?.append([...this.prevState, false, input]);
		}
		const initState = this.game.env.getState();
		const { selected } = this.game.getState();
		const { orders } = this.game;

		if (this.skipPhase) {
			orderIndex = orders.moveIndexes[0];
		}

		let [order_, state , reward] = this.game.step(orders.all[orderIndex]);

		if (this.skipPhase) {
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
		this.skipPhase = false;
		this.prevState = null;
		this.game.reset();
	}
}

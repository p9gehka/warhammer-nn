export class ControlledAgent {
	prevState = null;
	constructor(game, config = {}) {
		this.game = game;
		const { replayMemory } = config;
		this.replayMemory = replayMemory ?? null;
	}

	playStep(orderIndex) {
		const input = this.game.getInput();
		if (this.replayMemory !== null && this.prevState !== null) {
			this.replayMemory?.append([...this.prevState, input]);
		}
		const [order_, state, reward] = this.game.step(this.game.orders.all[orderIndex]);
		this.prevState = [input, orderIndex, reward];
		return [order_, state, reward];
	}

	reset() {
		this.prevState = null;
	}
}

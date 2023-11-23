export class ControlledAgent {
	constructor(game) {
		this.game = game;
	}

	playStep(orderIndex) {
		const input = this.game.getInput();
		return this.game.step(this.game.orders.all[orderIndex]);
	}
}

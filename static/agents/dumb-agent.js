import { Action } from '../environment/orders.js';

export class DumbAgent {
	constructor(game, config) {
		this.game = game;
	}
	playStep() {
		return this.game.step({ action: Action.NextPhase });
	}
	awarding() {}
	reset() {
		this.game.reset();
	}
	trainOnReplayBatch() {}
}

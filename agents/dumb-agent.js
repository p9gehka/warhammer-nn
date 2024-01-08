import { Action } from '../environment/player-environment.js';

export class DumbAgent {
	constructor(game, config) {
		this.game = game;
	}
	playStep() {
		return this.game.step(this.game.orders[Action.NextPhase][0])
	}
	awarding() {}
	reset() {
		this.game.reset();
	}
	trainOnReplayBatch() {}
}

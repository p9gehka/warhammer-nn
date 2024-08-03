import { Action } from '../environment/orders.js';

export class PlayerDumb {
	constructor(env) {
		this.env = env;
	}
	playStep() {
		const state = this.env.step({ action: Action.NextPhase });
		return [{ action: Action.NextPhase }, state, { index: 0, estimate: 0 }];

	}
}

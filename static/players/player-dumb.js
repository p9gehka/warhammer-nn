import { BaseAction } from '../environment/warhammer.js';

export class PlayerDumb {
	constructor(env) {
		this.env = env;
	}
	playStep() {
		const state = this.env.step({ action: BaseAction.NextPhase });
		return [{ action: BaseAction.NextPhase }, state, { index: 0, estimate: 0 }];
	}
}

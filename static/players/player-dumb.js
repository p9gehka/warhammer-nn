import { BaseAction } from '../environment/warhammer.js';

export class PlayerDumb {
	static name = 'Dumb';
	constructor(playerId, env) {
		this.playerId = playerId;
		this.env = env;
	}
	playStep() {
		const state = this.env.step({ action: BaseAction.NextPhase });
		return [{ action: BaseAction.NextPhase }, state, { index: 0, estimate: 0 }];
	}
	reset() {}
	load() {}
	getState() {
		return { selected: 0, shootingQueue: [], shootingTargeting: {} };
	}
}

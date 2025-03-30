import { BaseAction } from '../environment/warhammer.js';
import { PlayerAgent } from './player-agent.js';

export class PlayerDumb extends PlayerAgent {
	constructor(playerId, env) {
		super(playerId, env)
		this.playerId = playerId;
		this.env = env;
	}
	playStep() {
		const state = this.env.step({ action: BaseAction.NextPhase });
		return [{ action: BaseAction.NextPhase }, state, { index: 0, estimate: 0 }];
	}
	reset() {}
	load() {}
}

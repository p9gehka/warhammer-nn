import { MoveAgent as MoveToObject } from '../agents/move-agent/move-all-to-1-object-agent.js';
import { PlayerAgent } from './player-agent.js';

let agents = { moveToObject: MoveToObject };

export class PlayerEasy extends PlayerAgent {
	constructor(...args) {
		super(...args);

		this.agent = new MoveToObject();
	}
	setAgent(agent) {
		this.agent = new agents[agent];
	}
}
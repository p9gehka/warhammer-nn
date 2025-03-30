import { MoveAgent as MoveToObject } from '../agents/move-agent/move-to-object-agent.js';
import { MoveAgent as MoveToFreeObject } from '../agents/move-agent/move-to-free-object-agent.js';
import { PlayerAgent } from './player-agent.js';

let agents = { moveToObject: MoveToObject, moveToFreeObject: MoveToFreeObject };

export class PlayerEasy extends PlayerAgent {
	constructor(...args) {
		super(...args);

		this.agent = new MoveToObject();
	}
	setAgent(agent) {
		this.agent = new agents[agent];
	}
}

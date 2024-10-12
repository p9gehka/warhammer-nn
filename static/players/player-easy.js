import { MoveAgent as MoveToObject } from '../agents/move-agent/move-to-object-agent.js';
import { MoveAgent as MoveToFreeObject } from '../agents/move-agent/move-to-free-object-agent.js';
import { DumbAgent } from '../agents/dumb-agent.js';
import { PlayerAgent } from './player-agent.js';
import { Phase } from '../environment/warhammer.js';

let agents = { moveToObject: MoveToObject, moveToFreeObject: MoveToFreeObject };

export class PlayerEasy extends PlayerAgent {
	constructor(...args) {
		super(...args);
		this.agents = {
			[Phase.Movement]: new MoveToObject(),
			[Phase.Shooting]: new DumbAgent()
		}
	}
	setAgent(agent) {
		this.agents[Phase.Movement] = new agents[agent];
	}
}

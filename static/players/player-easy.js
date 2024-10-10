import { MoveAgent } from '../agents/move-agent/move-to-object-agent.js';
import { PlayerAgent } from './player-agent.js';

export class PlayerEasy extends PlayerAgent {
	constructor(...args) {
		super(...args);
		this.agent = new MoveAgent();
	}
}

import { PlayerAgent } from './player-agent.js';
import { ShootInHightIdAgent } from '../agents/shoot-agent/shoot-in-hight-id-agent.js';
import { MoveAgent } from '../agents/move-agent/move-to-object-agent.js';
import { Phase } from '../environment/warhammer.js';

export class PlayerComputerSimple1 extends PlayerAgent {
	name = 'Computer Simple 1'

	async load() {
		this.agents = {
			[Phase.Movement]: new MoveAgent(),
			[Phase.Shooting]: new ShootInHightIdAgent(),
		};

		await this.agents[Phase.Movement].load();
		await this.agents[Phase.Shooting].load();
	}
}
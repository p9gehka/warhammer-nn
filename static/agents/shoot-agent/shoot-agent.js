import { shootOrders } from './shoot-orders.js';
import { RandomAgent } from '../random-agent.js';
import { getInput } from '../../environment/nn-input.js';

export class ShootAgentBase {
	fillAgent = new RandomAgent(shootOrders, getInput);

	playStep(state, playerState) {
		if (this.onlineNetwork === undefined) {
			return this.fillAgent.playStep(state);
		}
	}
}

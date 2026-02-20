import { shootOrders } from './shoot-orders.js';
import { RandomAgent } from '../random-agent.js';
import { getInput } from '../../environment/nn-input.js';
import { getRandomInteger, argMax } from '../../utils/index.js';

export class ShootInHightIdAgent {
	fillAgent = new RandomAgent(shootOrders, getInput);
	async load() {
		/* pass */ 
	}
	playStep(state, playerState) {
		const { visibleOpponentUnits, selected } = playerState;
		let orderIndex = 0;
		const selectedModelId = state.players[state.player].models[selected];

		if (state.availableToShoot.includes(selectedModelId) && visibleOpponentUnits.length > 0) {
			const unitIndex = visibleOpponentUnits[argMax(visibleOpponentUnits)];
			if (shootOrders[unitIndex + 1] !== undefined) {
				orderIndex = unitIndex + 1;
			}
		}
		return { order: shootOrders[orderIndex], orderIndex, estimate: 0 };
	}
}
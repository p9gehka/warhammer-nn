import { shootOrders } from './shoot-orders.js';
import { RandomAgent } from '../random-agent.js';
import { getInput } from '../../environment/nn-input.js';
import { getRandomInteger } from '../../utils/index.js';

export class ShootAgentBase {
	fillAgent = new RandomAgent(shootOrders, getInput);

	playStep(state, playerState) {
		const { visibleOpponentUnits, selected } = playerState;
		let orderIndex = 0;
		const selectedModelId = state.players[state.player].models[selected]
		if (state.availableToShoot.includes(selectedModelId) && visibleOpponentUnits.length > 0) {
			const unitIndex = getRandomInteger(0, visibleOpponentUnits.length);
			if (shootOrders[orderIndex] !== undefined) {
				orderIndex = visibleOpponentUnits[unitIndex] + 1;
			}
		}

		return { order: shootOrders[orderIndex], orderIndex, estimate: 0 };
	}
}

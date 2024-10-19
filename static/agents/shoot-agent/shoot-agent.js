import { shootOrders } from './shoot-orders.js';
import { RandomAgent } from '../random-agent.js';
import { getInput } from '../../environment/nn-input.js';
import { getRandomInteger, argMax } from '../../utils/index.js';

export class ShootAgentBase {
	fillAgent = new RandomAgent(shootOrders, getInput);
	async load() {
		/* pass */ 
	}
	playStep(state, playerState) {
		const { visibleOpponentUnits, selected } = playerState;
		let orderIndex = 0;
		const selectedModelId = state.players[state.player].models[selected]

		if (state.availableToShoot.includes(selectedModelId) && visibleOpponentUnits.length > 0) {
			const unitIndex = argMax(visibleOpponentUnits) + 1;
			if (shootOrders[unitIndex] !== undefined) {
				orderIndex = unitIndex;
			}
		}
		return { order: shootOrders[orderIndex], orderIndex, estimate: 0 };
	}
}

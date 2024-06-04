import { Action, Orders } from '../environment/orders.js';
import { Phase } from '../environment/warhammer.js';
import { getRandomInteger } from '../utils/index.js';

export class Agent {
	constructor(game, config) {
		this.game = game;
		this.orders = new Orders().getOrders();
		this.nextPhaseCounter = 0;
	}
	playStep() {
		let orders = [{ action: Action.NextPhase }];
		const state = this.game.env.getState();
		console.log(state);
		if (state.phase === Phase.Movement && this.nextPhaseCounter < 15) {
			const availableSelectOrders = state.players[this.game.playerId].models
				.map((modelId, modelIndex) => [modelId, modelIndex])
				.filter(([modelId, modelIndex]) => state.modelsStamina[modelId] > 0)
				.map(([modelId, modelIndex]) => this.orders.selectIndexes[modelIndex]);

			if (availableSelectOrders.length !== 0) {
				orders = []
				const selectOrder = this.orders.all[availableSelectOrders[getRandomInteger(0, availableSelectOrders.length)]];
				orders.push(selectOrder)
				
				orders.push(this.orders.all[this.orders.moveIndexes[getRandomInteger(0, this.orders.moveIndexes.length)]])

				this.nextPhaseCounter++;
			}
		}
		if (orders[0].action === Action.NextPhase) {
			this.nextPhaseCounter = 0;
		}
		console.log(orders);
		return orders.reduce((_, order) => this.game.step(order), null);
	}
	awarding() {}
	reset() {
		this.game.reset();
		this.nextPhaseCounter = 0;
	}
	trainOnReplayBatch() {}
}

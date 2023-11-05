import { rotatedDegrees } from '../static/utils/vec2.js';
import gameSettings from '../static/settings/game-settings0.1.json' assert { type: 'json' };
import { Action, Phase } from '../environment/warhammer.js';
import { Entities  } from '../environment/player-environment.js';

const { battlefield } = gameSettings;
import { getRandomInteger } from '../static/utils/index.js';
import { getOrders } from './utils.js';

const F = 50;

export class RandomAgent {
	orders = []
	attempts = 0;
	constructor(game) {
		this.game = game;
		this.orders = getOrders();
	}
	getOrder() {
		return this.orders[getRandomInteger(0, this.orders.length)]
	}

	playStep() {
		const state = this.game.env.getState();

		for (let i = 0; i < F; i++) {
			this.attempts++;
			const order = this.getOrder();

			if (state.phase === Phase.Movement && order.action === Action.Move) {
				return this.game.step(order)
			}

			if (state.phase === Phase.Shooting && order.action === Action.Shoot) {
				return this.game.step(order)
			}
			if (order.action === Action.NextPhase) {
				break;
			}
		}

		return this.game.step({ action: Action.NextPhase})
	}
}

import { rotatedDegrees } from '../static/utils/vec2.js';
import gameSettings from '../static/settings/game-settings0.1.json' assert { type: 'json' };
import { Phase } from '../environment/warhammer.js';
import { Action, Channel2Name, Channel1Name  } from '../environment/player-environment.js';

const { battlefield } = gameSettings;
import { getRandomInteger } from '../static/utils/index.js';
import { getOrders } from './utils.js';


export class RandomAgent {
	orders = []
	attempts = 0;
	constructor(game) {
		this.game = game;
		this.orders = getOrders();
	}
	reset() {
		this.attempts = 0;
	}
	getOrderIndex() {
		const input = this.game.getInput();
		if (input[Channel2Name.Selected].length === 0) {
			return this.orders.selectIndexes[getRandomInteger(0, this.orders.selectIndexes.length)];
		}

		if (input[Channel1Name.SelfStrikeTeamAvailableToMove].length !== 0 || input[Channel1Name.SelfStealthAvailableToMove].length !== 0) {
			return this.orders.selectAndMoveIndexes[getRandomInteger(0, this.orders.selectAndMoveIndexes.length)];
		}

		if (input[Channel1Name.SelfStrikeTeamAvailableToShoot].length !== 0 || input[Channel1Name.SelfStealthAvailableToShoot].length !== 0) {
			return this.orders.selectAndShootIndexes[getRandomInteger(0, this.orders.selectAndShootIndexes.length)];
		}

		return this.orders.nextPhaseIndex;
	}

	playStep() {
		this.attempts++;
		const order = this.orders.all[this.getOrderIndex()];
		return this.game.step(order)
	}

	trainOnReplayBatch() {
		
	}
}

import { Orders, Action } from './orders.js';
import { channels, getInput } from './nn-input.js';

import { getStateTensor } from '../utils/get-state-tensor.js';
import { eq } from '../utils/vec2.js';

export class PlayerEnvironment {
	width = 22;
	height = 22;
	channels = channels;
	vp = 0;
	_selectedModel = null;
	cumulativeReward = 0;

	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
		this.reset();
		this.orders = new Orders().getOrders();
		this._selectedModel = this.env.players[this.playerId].models[0];
	}

	reset() {
		this.vp = 0;
		this.cumulativeReward = 0;
	}

	step(order) {
		let playerOrder;
		const { action } = order;
		const prevState = this.env.getState();

		if (action === Action.Move) {
			playerOrder = {action, id: this._selectedModel, vector: order.vector };
		} else {
			playerOrder = order;
		}
		const state = this.env.step(playerOrder);


		let reward = -1 * 10;
		this.cumulativeReward += reward;

		return [{ ...playerOrder, misc: state.misc }, state, reward];
	}
	awarding() {
		const state = this.env.getState();
		const { players } = state;
		let reward = 0;

		if (this.loose()) {
			reward -= this.env.objectiveControlReward * 500;/*(5 * 3)*/
		}

		this.cumulativeReward += reward;
		return reward;
	}
	primaryReward() {
		const state = this.env.getState();

		const { vp } = state.players[this.playerId];
		let reward = (vp - this.vp) * 5 * 5;
		this.cumulativeReward += reward;
		this.vp = vp;
		return reward;
	}
	getInput() {
		const state = this.env.getState();
		return getInput(state);
	}

	printStateTensor() {
		const input = this.getInput();
		const stateTensor = getStateTensor([input], this.height, this.width, this.channels);
		console.log('*************************');
		console.log(stateTensor.arraySync().map(v => v.map(c=> c.join('|')).join('\n')).join('\n'));
		console.log('*************************');
	}
	loose() {
		const player = this.env.players[this.playerId];
		return player.models.every(gameModelId => this.env.models[gameModelId].dead);
	}
}

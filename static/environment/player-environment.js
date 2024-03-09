import { Orders, Action } from './orders.js';
import { channels, getInput } from './nn-input.js';

import { getStateTensor } from '../utils/get-state-tensor.js';
import { eq } from '../utils/vec2.js';

export class PlayerEnvironment {
	height = 22;
	width = 15;
	channels = channels;
	vp = 0;
	_selectedModel = null;
	cumulativeReward = 0;
	frameCount = 0;
	prevOrderAction = 0;
	phaseStepCounter = 0;
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
		this.phaseStepCounter = 0;
		this._selectedModel = 0;
	}

	step(order) {
		this.phaseStepCounter++;
		this.frameCount++;
		let playerOrder;
		const { action } = order;
		const prevState = this.env.getState();

		if (order.action === Action.Select) {
			this._selectedModel = this.env.players[this.playerId].models[order.id];
			playerOrder = {...order.action, id: this._selectedModel }
		}

		if (action === Action.Move) {
			playerOrder = {action, id: this._selectedModel, vector: order.vector, expense: order.expense };
		} else {
			playerOrder = order;
		}
		let state;
		let reward = 0;
		if (this.phaseStepCounter > 15) {
			this.env.end();
		}

		state = this.env.step(playerOrder);
		const { vp } = state.players[this.playerId];
		reward = vp - this.vp;
		this.vp = vp;

		if (
			state.models[this._selectedModel] === null || (playerOrder.action === Action.Move && eq(prevState.models[this._selectedModel], state.models[this._selectedModel]))
		) {
			reward--;
		} else {
			if (playerOrder.action !== Action.NextPhase) {
				reward++;
			} else {
				reward -= 0.1;
			}
		}

		if (action === Action.NextPhase) {
			this.phaseStepCounter = 0;
		}

		this.cumulativeReward += reward;
		this.prevOrderAction = action;
		return [{ ...playerOrder, misc: state.misc }, state, reward];
	}
	awarding() {
		const state = this.env.getState();
		const { players } = state;
		let reward = 0;

		if (this.loose()) {
			reward -= 5 * this.env.objectiveControlReward * 3;
		}

		this.cumulativeReward += reward;
		return reward;
	}
	getState() {
		return { selected: this._selectedModel };
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

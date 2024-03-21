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
	frameCount = 0;
	prevOrderAction = 0;
	phaseStepCounter = 0;

	_shootingQueue = [];
	_shootingTargeting = {};
	_selectedWeapon = null;
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.opponentId = (playerId+1) % 2;
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

		if (action === Action.Select) {
			this._selectedModel = this.env.players[this.playerId].models[order.id];
			playerOrder = { ...order, id: this._selectedModel };
		} else if (action === Action.SetTarget) {
			const selectedWeapon = this._shootingQueue.at(-1);
			this._shootingTargeting[selectedWeapon] = this.env.players[this.opponentId].units[order.id].id;
			playerOrder = order;
		} else if (action === Action.Shoot && this._shootingQueue.length > 0) {
			const selectedWeapon = this._shootingQueue.shift();
			playerOrder = {
				action: Action.Shoot,
				id: this._selectedModel,
				weaponId: selectedWeapon,
				target: this._shootingTargeting[selectedWeapon],
			};
			delete this._shootingTargeting[selectedWeapon];
		} else if (action === Action.Move) {
			playerOrder = {action, id: this._selectedModel, vector: order.vector, expense: order.expense };
		} else if (action === Action.SelectWeapon) {
			delete this._shootingTargeting[order.id];
			this._shootingQueue = this._shootingQueue.filter(v => v !== order.id);
			this._shootingQueue.push(order.id)
			playerOrder = order;
		} else {
			playerOrder = order;
		}
		let state;
		let reward = 0;

		state = this.env.step(playerOrder);
		const { vp } = state.players[this.playerId];
		reward = (vp - this.vp) * 5;
		reward--;

		this.vp = vp;

		this.cumulativeReward += reward;
		this.prevOrderAction = action;
		return [{ ...playerOrder, misc: state.misc }, state, reward];
	}
	awarding() {
		const state = this.env.getState();
		const { players } = state;
		let reward = 0;

		if (this.loose()) {
			reward -= this.env.objectiveControlReward * 10;/*(5 * 3)*/
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

import { Orders, Action } from '../environment/orders.js';
import { channels, getInput } from '../environment/nn-input.js';

import { getStateTensor } from '../utils/get-state-tensor.js';
import { eq } from '../utils/vec2.js';

export class PlayerAgent {
	width = 44;
	height = 30;
	channels = channels;
	vp = 0;
	_selectedModel = null;
	cumulativeReward = 0;

	constructor(playerId, env, agent) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
		this.reset();
		this.orders = new Orders().getOrders();
		this._selectedModel = this.env.players[this.playerId].models[0];
		this.agent = agent;
	}

	reset() {
		this.primaryVP = 0;
		this.cumulativeReward = 0;
	}
	playStep() {
		const { orders, height, width, channels } = this;
		const input = this.getInput();
		const inputTensor = getStateTensor([input], height, width, channels);
		const orderIndex = this.agent.playStep(input, inputTensor);
		const order = this.orders.all[orderIndex];
		let [order_, state ,reward] = this.step(order);

		if (order.action === Action.NextPhase) {
			reward += this.game.primaryReward();
		}
		
		this.cumulativeReward += reward;

		return [order_, state, reward, { index: orderIndex, estimate: estimate.toFixed(3) }];

	}
	step(order) {
		let playerOrder;
		const { action } = order;
		const prevState = this.env.getState();

		if (action === Action.Move) {
			playerOrder = {action, id: this._selectedModel, vector: order.vector, expense: order.expense };
		} else {
			playerOrder = order;
		}
		const state = this.env.step(playerOrder);

		let reward = -0.5;

		

		return [{ ...playerOrder, misc: state.misc }, state, reward];
	}
	awarding() {
		const state = this.env.getState();
		const { players } = state;
		let reward = 0;

		this.cumulativeReward += reward;
		return reward;
	}
	primaryReward() {
		const state = this.env.getState();
		const { primaryVP } = state.players[this.playerId];
		let reward = (primaryVP - this.primaryVP) * 5;
		this.cumulativeReward += reward;
		this.primaryVP = primaryVP;
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
}

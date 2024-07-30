import { Action } from '../environment/orders.js';
import { MoveAgent } from '../agents/move-agent44x30/move-agent44x30.js';


import { eq } from '../utils/vec2.js';

export class PlayerAgent {
	vp = 0;
	_selectedModel = null;
	cumulativeReward = 0;

	constructor(playerId, env, agent) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
		this.reset();
		this._selectedModel = this.env.players[this.playerId].models[0];
		this.agent = new MoveAgent();
	}
	async load() {
		await this.agent.load();
	}
	reset() {
		this.primaryVP = 0;
		this.cumulativeReward = 0;
	}
	playStep() {
		const baseState = this.env.getState();
		const { orderIndex, order, estimate } = this.agent.playStep(baseState);
		let [order_, state ,reward] = this.step(order);

		if (order.action === Action.NextPhase) {
			reward += this.primaryReward();
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
}

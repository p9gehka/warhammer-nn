import { Action } from './static/environment/orders.js';
import { MoveAgent } from './static/agents/move-agent44x30/move-agent44x30.js';


import { eq } from '../utils/vec2.js';

export class PlayerAgent {
	vp = 0;
	_selectedModel = null;
	cumulativeReward = 0;

	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
		this.reset();
		this._selectedModel = this.env.players[this.playerId].models[0];
		this.agent = new MoveAgent();
	}

	reset() {
		this.primaryVP = 0;
		this.cumulativeReward = 0;
	}
	playStep() {
		const prevState = this.env.getState();

		let orderIndex;
		const input = this.agent.getInput(prevState);
		if (Math.random() < this.epsilon) {
			orderIndex = getRandomInteger(0, this.agent.orders.all.length);
		} else if (input[Channel2Name.ObjectiveMarker].some(pos => eq(pos, input[0][0])) && Math.random() < this.epsilon) {
			orderIndex = 0;
		} else {
			const { orderIndex: stepOrderIndex, order, estimate } = this.agent.playStep(prevState);
			orderIndex = stepOrderIndex;
		}

		const order = this.agent.orders.all[orderIndex];

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

	primaryReward() {
		const state = this.env.getState();
		const { primaryVP } = state.players[this.playerId];
		let reward = (primaryVP - this.primaryVP) * 5;
		this.cumulativeReward += reward;
		this.primaryVP = primaryVP;
		return reward;
	}
}


export class Student extends PlayerAgent {
	orders = {};
	prevState = null;
	autoNext = true;

	constructor(game, config = {}) {
		super();
		const { replayMemory, nn, epsilonInit, epsilonFinal, epsilonDecayFrames } = config
		this.game = game;

		this.onlineNetwork = nn;
		this.replayMemory = replayMemory ?? null;
		this.frameCount = 0;
		this.epsilonInit = epsilonInit ?? 0.5;
		this.epsilonFinal = epsilonFinal ?? 0.01;
		this.epsilonDecayFrames = epsilonDecayFrames ?? 1e6;
		this.epsilonIncrement_ = (this.epsilonFinal - this.epsilonInit) / this.epsilonDecayFrames;
		this.epsilon = this.epsilonInit;
	}

	getOrderRandomIndex() {
		return getRandomInteger(0, this.game.orders.all.length);
	}

	playStep() {
		const { orders, height, width, channels } = this.game;
		this.frameCount++;
		this.epsilon = this.frameCount >= this.epsilonDecayFrames ?
			this.epsilonFinal :
			this.epsilonInit + this.epsilonIncrement_ * this.frameCount;
		const prevState = this.env.getState();
		const input = this.agent.getInput(prevState)
		if (this.prevState !== null) {
			this.replayMemory?.append([...this.prevState, false, input]);
		}
		let epsilon = this.epsilon;
		let [orderIndex, reward] = super.playStep()

		this.prevState = [input, orderIndex, reward];
		return [order_, state, reward];
	}

	reset() {
		this.stepAttemp = 0;
		this.prevState = null;
		this.game.reset();
		this.checkSize();
	}
}

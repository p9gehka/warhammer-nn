import { getRandomInteger } from '../static/utils/index.js';
import { eq, sub, len, div } from '../static/utils/vec2.js';
import { Channel2Name } from '../static/environment/nn-input.js';
import { PlayerAgent } from '../static/players/player-agent.js';
import { BaseAction } from '../static/environment/warhammer.js';
import { deployment } from '../static/battlefield/deployment.js';

export class StudentAgent extends PlayerAgent {
	playTrainStep(epsilon) {
		const prevState = this.env.getState();
		let orderIndex;
		let estimate = 0;
		const input = this.agent.getInput(prevState);

		if (Math.random() < epsilon) {
			orderIndex = getRandomInteger(0, this.agent.orders.length);
		} else {
			let { orderIndex: stepOrderIndex, estimate } = this.agent.playStep(prevState);
			orderIndex = stepOrderIndex;
		}

		const order = this.agent.orders[orderIndex];

		let [order_, state] = this.step(order);

		return [order_, state, { index: orderIndex, estimate: estimate.toFixed(3) }];
	}
}


export class Student {
	orders = {};
	prevState = null;
	autoNext = true;

	constructor(playerId, env, config = {}) {
		const { replayMemory, nn, epsilonInit, epsilonFinal, epsilonDecayFrames } = config
		this.env = env;

		this.replayMemory = replayMemory ?? null;
		this.frameCount = 0;
		this.epsilonInit = epsilonInit ?? 0.5;
		this.epsilonFinal = epsilonFinal ?? 0.01;
		this.epsilonDecayFrames = epsilonDecayFrames ?? 1e6;
		this.epsilonIncrement_ = (this.epsilonFinal - this.epsilonInit) / this.epsilonDecayFrames;
		this.epsilon = this.epsilonInit;
		this.playerId = playerId;
		this.player = new StudentAgent(playerId, env);

		this.setOnlineNetwork(nn);
		this.rewarder = new Rewarder(this.playerId, this.env);
	}
	setOnlineNetwork(nn) {
		this.player.agent.onlineNetwork = nn;
	}
	getOnlineNetwork(nn) {
		return this.player.agent.onlineNetwork;
	}
	getCumulativeReward() {
		return this.rewarder.cumulativeReward;
	}

	playStep() {
		this.frameCount++;
		this.epsilon = this.frameCount >= this.epsilonDecayFrames ?
			this.epsilonFinal :
			this.epsilonInit + this.epsilonIncrement_ * this.frameCount;
		const prevState = this.env.getState();
		const input = this.player.agent.getInput(prevState);

		if (this.prevMemoryState !== null && this.prevState !== undefined) {
			let reward = this.rewarder.step(this.prevState, this.player.agent.orders[this.prevMemoryState[1]], this.epsilon);
			this.replayMemory?.append([...this.prevMemoryState, reward, false, input]);
		}
		const result = this.player.playTrainStep(this.epsilon);
		this.prevMemoryState = [input, result[2].index];
		this.prevState = prevState;
		return result;
	}

	reset() {
		this.prevMemoryState = null;
		this.rewarder.reset();
		this.player.reset();
	}
}

export class Rewarder {
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.cumulativeReward = 0;
		this.primaryVP = 0;
	}
	step(prevState, order, epsilon) {
		let reward = 0;
		const state = this.env.getState();

		const { primaryVP } = state.players[this.playerId];
		reward += this.primaryReward(order, primaryVP);
		reward += this.epsilonReward(prevState, order, epsilon);
		this.cumulativeReward += reward;
		return reward;
	}
	epsilonReward(prevState, order, epsilon) {
		let reward = 0;
		if (order.action === BaseAction.Move) {
			const state = this.env.getState();
			const initialPosititon = prevState.models[this.playerId];
			const currentPosition = state.models[this.playerId];

			const center = div(state.battlefield.size, 2);
			const currentPositionDelta = len(sub(center, sub(currentPosition, center).map(Math.abs)));
			const initialPosititonDelta = len(sub(center, sub(initialPosititon, center).map(Math.abs)));
			reward += (currentPositionDelta - initialPosititonDelta);
		}
		return reward * epsilon * 0;
	}

	primaryReward(order, primaryVP) {
		let reward = 0;
		if (order.action === BaseAction.NextPhase) {
			reward += (primaryVP - this.primaryVP);
			this.primaryVP = primaryVP;
		}
		return reward;
	}

	reset() {
		this.primaryVP = 0;
		this.cumulativeReward = 0;
	}
}

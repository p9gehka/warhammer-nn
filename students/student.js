import { getRandomInteger } from '../static/utils/index.js';
import { eq } from '../static/utils/vec2.js';
import { Channel2Name, Channel3Name } from '../static/environment/nn-input.js';
import { PlayerAgent } from '../static/players/player-agent.js';
import { Action } from '../static/environment/orders.js';

export class StudentAgent extends PlayerAgent {
	playTrainStep() {
		const prevState = this.env.getState();
		let orderIndex;
		let estimate = 0;
		const input = this.agent.getInput(prevState, this.getState());
		const selected = input[Channel3Name.Selected][0];

		if (Math.random() < this.epsilon) {
			orderIndex = getRandomInteger(0, this.agent.orders.all.length);
		} else if (input[Channel2Name.ObjectiveMarker].some(pos => eq(pos, selected)) && Math.random() < this.epsilon) {
			orderIndex = 0;
		} else {
			let { orderIndex: stepOrderIndex, estimate } = this.agent.playStep(prevState, this.getState());
			orderIndex = stepOrderIndex;
		}

		const order = this.agent.orders.all[orderIndex];

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
		const input = this.player.agent.getInput(prevState, this.player.getState());

		if (this.prevState !== null) {
			this.replayMemory?.append([...this.prevState, false, input]);
		}
		let epsilon = this.epsilon;
		const result = this.player.playTrainStep();
		let reward = this.rewarder.step(result[0].action);

		this.prevState = [input, result[2].index, reward];
		return result;
	}

	reset() {
		this.prevState = null;
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
	primaryReward(primaryVP) {
		let reward = (primaryVP - this.primaryVP) * 5;
		this.primaryVP = primaryVP;
		return reward;
	}
	step(action, state) {
		let reward = -0.5;
		if (action === Action.NextPhase) {
			const state = this.env.getState();
			const { primaryVP } = state.players[this.playerId];
			reward += this.primaryReward(primaryVP);
		}
		this.cumulativeReward += reward;
		return reward;
	}
	reset() {
		this.primaryVP = 0;
		this.cumulativeReward = 0;
	}
}

import { getRandomInteger } from '../static/utils/index.js';
import { eq, sub, len } from '../static/utils/vec2.js';
import { Channel2Name, Channel3Name } from '../static/environment/nn-input.js';
import { PlayerAgent } from '../static/players/player-agent.js';
import { BaseAction } from '../static/environment/warhammer.js';
import { deployment } from '../static/battlefield/deployment.js';

export class StudentAgent extends PlayerAgent {
	playTrainStep() {
		const prevState = this.env.getState();
		let orderIndex;
		let estimate = 0;
		const input = this.agent.getInput(prevState, this.getState());
		const selected = input[Channel3Name.Selected][0];

		if (Math.random() < this.epsilon) {
			orderIndex = getRandomInteger(0, this.agent.orders.length);
		} else if (input[Channel2Name.ObjectiveMarker].some(pos => eq(pos, input[0][0])) && Math.random() < this.epsilon) {
			orderIndex = 0;
		} else {
			let { orderIndex: stepOrderIndex, estimate } = this.agent.playStep(prevState, this.getState());
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
		this.rewarder = new Rewarder(this.env, this.player);
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
		let reward = this.rewarder.step(result[0], epsilon);
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
	constructor(env, player) {
		this.env = env;
		this.player = player;
		this.playerId = player.playerId;
		this.cumulativeReward = 0;
		this.primaryVP = 0;
	}
	step(order, epsilon) {
		let reward = -7;
		const state = this.env.getState();

		const { primaryVP } = state.players[this.playerId];
		reward += this.primaryReward(order, primaryVP);
		reward += this.epsilonReward(order, epsilon);
		this.cumulativeReward += reward;
		return reward;
	}
	epsilonReward(order, epsilon) {
		let reward = 0;
		if (order.action === BaseAction.Move) {
			const state = this.env.getState();
			const playerState = this.player.getState();
			const selected = state.players[this.playerId].models[playerState.selected];
			const initialPosititon = sub(state.models[selected], order.vector);
			const currentPosition = state.models[selected];

			const objectiveMarkers = new deployment[state.battlefield.deployment]().objective_markers;
			const objectiveDistances = objectiveMarkers.map(deployment => len(sub(deployment, initialPosititon)) - len(sub(deployment, currentPosition)));
			reward += objectiveDistances.reduce((a, b) => a + b, 0);
		}
		return reward * epsilon;
	}

	primaryReward(order, primaryVP) {
		let reward = 0;
		if (order.action === BaseAction.NextPhase) {
			reward = (primaryVP - this.primaryVP) * 5;
			this.primaryVP = primaryVP;
		}
		return reward;
	}

	reset() {
		this.primaryVP = 0;
		this.cumulativeReward = 0;
	}
}

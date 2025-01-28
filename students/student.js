import { getRandomInteger } from '../static/utils/index.js';
import { eq, sub, len, div, add } from '../static/utils/vec2.js';
import { Channel2Name, Channel3Name } from '../static/environment/nn-input.js';
import { PlayerAgent } from '../static/players/player-agent.js';
import { BaseAction, Phase } from '../static/environment/warhammer.js';
import { deployment } from '../static/battlefield/deployment.js';

export class StudentAgent extends PlayerAgent {
	playTrainStep(epsilon) {
		const prevState = this.env.getState();
		const agent = this.agents[prevState.phase];	
		let estimate = 0;
		const input = agent.getInput(prevState, this.getState());
		let orderIndex = 0;
		if (Math.random() < epsilon) {
			orderIndex = agent.getRandomAvailableOrderIndex(prevState, this.getState());
		} else {
			let { orderIndex: stepOrderIndex, estimate } = agent.playStep(prevState, this.getState());
			orderIndex = stepOrderIndex;
		}

		const order = agent.orders[orderIndex];

		let [order_, state] = this.steps[prevState.phase](order);

		return [order_, state, { orderIndex, estimate: estimate.toFixed(3) }];
	}
}


export class Student {
	orders = {};
	prevState = null;
	prevPlayerState = undefined;
	prevMemoryState = null;
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
		this.player.agents[Phase.Movement].onlineNetwork = nn;
	}
	getOnlineNetwork(nn) {
		return this.player.agents[Phase.Movement].onlineNetwork;
	}
	getCumulativeReward() {
		return this.rewarder.cumulativeReward;
	}

	playStep() {
		const prevState = this.env.getState();
		if (prevState.phase !== Phase.Movement) {
			return this.player.playStep();
		}

		this.frameCount++;
		this.epsilon = this.frameCount >= this.epsilonDecayFrames ?
			this.epsilonFinal :
			this.epsilonInit + this.epsilonIncrement_ * this.frameCount;

		const playerState = this.player.getState();
		const input = this.player.agents[prevState.phase].getInput(prevState, this.player.getState());

		if (this.prevMemoryState !== null && this.prevState !== undefined && this.prevPlayerState !== undefined) {
			if (this.prevMemoryState[1] !== 0 || this.prevMemoryState[2] !== 0) {
				let reward = this.rewarder.step(this.prevState, playerState, this.prevPlayerState, this.player.agents[this.prevState.phase].orders[this.prevMemoryState[1]], this.epsilon);
				this.replayMemory?.append([this.prevMemoryState[0], this.prevMemoryState[1], reward, false, input]);
			}
		}

		const result = this.player.playTrainStep(this.epsilon);
		this.prevMemoryState = [input, result[2].orderIndex, result[2].estimate];
		this.prevState = prevState;
		this.prevPlayerState = playerState;
		
		return result;
	}

	reset() {
		this.prevMemoryState = null;
		this.rewarder.reset();
		this.player.reset();
	}

	awarding() {
		if (this.prevMemoryState !== null && this.prevState !== undefined) {
			if (this.prevMemoryState[1] !== 0 || this.prevMemoryState[2] !== 0) {
				const playerState = this.player.getState();
				let reward = this.rewarder.step(this.prevState, playerState, this.prevPlayerState, this.player.agents[this.prevState.phase].orders[this.prevMemoryState[1]], this.epsilon);
				this.replayMemory?.append([this.prevMemoryState[0], this.prevMemoryState[1], reward, true, null]);
			}
		}
	}
}

export class Rewarder {
	constructor(env, player) {
		this.env = env;
		this.player = player;
		this.playerId = player.playerId;
		this.cumulativeReward = 0;
		this.primaryVP = 0;
		this.initialGamma = 0.99;
		this.gamma = this.initialGamma;
	}
	step(prevState, playerState, prevPlayerState, order, epsilon) {
		let reward = 0;
		const state = this.env.getState();

		const { primaryVP } = state.players[this.playerId];
		if (order === undefined) {
			console.trace()
		}
		reward += this.primaryReward(order, primaryVP);
		reward += this.epsilonReward(prevState, playerState, prevPlayerState, order, epsilon);
		this.cumulativeReward += (reward * this.gamma);
		this.gamma = this.gamma * this.initialGamma;
		return reward;
	}
	epsilonReward(prevState, playerState, prevPlayerState, order, epsilon) {
		let reward = 0;

		if (order.action === BaseAction.Move && playerState.selected === prevPlayerState.selected && !isNaN(prevState.models[playerState.selected][0])) {
			const state = this.env.getState();
			const initialPosititon = prevState.models[playerState.selected];
			const expectedCurrentPosition = add(prevState.models[playerState.selected], order.vector);

			const center = div(state.battlefield.size, 2);
			const expectedCurrentPositionDelta = len(sub(expectedCurrentPosition, center).map(Math.abs));
			const initialPosititonDelta = len(sub(initialPosititon, center).map(Math.abs));
		
			reward += ((initialPosititonDelta - expectedCurrentPositionDelta) / 5);
		}

		return reward;
	}

	primaryReward(order, primaryVP) {
		let reward = 0;
		if (order.action === BaseAction.NextPhase) {
			reward += (primaryVP - this.primaryVP) * 5;
			this.primaryVP = primaryVP;
		}
		return reward;
	}

	reset() {
		this.primaryVP = 0;
		this.cumulativeReward = 0;
		this.gamma = this.initialGamma;
	}
}

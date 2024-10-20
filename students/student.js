import { getRandomInteger } from '../static/utils/index.js';
import { eq, sub, len, div } from '../static/utils/vec2.js';
import { Channel2Name, Channel3Name } from '../static/environment/nn-input.js';
import { PlayerAgent } from '../static/players/player-agent.js';
import { BaseAction } from '../static/environment/warhammer.js';
import { deployment } from '../static/battlefield/deployment.js';

export class StudentAgent extends PlayerAgent {
	playTrainStep(temperature) {
		const prevState = this.env.getState();
		let orderIndex;
		const input = this.agent.getInput(prevState, this.getState(temperature));
		const selected = input[Channel3Name.Order0][0];
		let { orderIndex: stepOrderIndex, estimate } = this.agent.playStep(prevState, this.getState(temperature));
		orderIndex = stepOrderIndex;

		const order = this.agent.orders[orderIndex];

		let [order_, state] = this.step(order);

		return [order_, state, { index: orderIndex, estimate: estimate.toFixed(3) }];
	}

	getState(temperature = 1) {
		return { ...super.getState(), temperature }
	}
}


export class Student {
	orders = {};
	prevState = null;
	autoNext = true;

	constructor(playerId, env, config = {}) {
		const { replayMemory, nn, temperatureInit, temperatureFinal, temperatureDecayFrames } = config
		this.env = env;

		this.replayMemory = replayMemory ?? null;
		this.frameCount = 0;
		this.temperatureInit = temperatureInit ?? 1;
		this.temperatureFinal = temperatureFinal ?? 1;
		this.temperatureDelta = this.temperatureInit - this.temperatureFinal
		this.temperatureDecayFrames = temperatureDecayFrames ?? 1e6;
		this.temperatureIncrement_ = (this.temperatureFinal - this.temperatureDelta) / this.temperatureDecayFrames;
		this.temperature = this.temperatureInit;
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
		this.temperature = Math.max(this.frameCount >= this.temperatureDecayFrames ?
			this.temperatureFinal :
			this.temperatureInit + this.temperatureIncrement_ * this.frameCount, 1);

		const prevState = this.env.getState();
		const input = this.player.agent.getInput(prevState, this.player.getState());

		if (this.prevMemoryState !== null && this.prevState !== undefined) {
			let reward = this.rewarder.step(this.prevState, this.player.agent.orders[this.prevMemoryState[1]], this.temperature / 200);
			this.replayMemory?.append([...this.prevMemoryState, reward, false, input]);
		}
		const result = this.player.playTrainStep(this.temperature);
		this.prevMemoryState = [input, result[2].index];
		this.prevState = prevState;
		return result;
	}

	reset() {
		this.prevMemoryState = null;
		this.rewarder.reset();
		this.player.reset();
	}

	awarding() {
		if (this.prevMemoryState !== null && this.prevState !== undefined) {
			let reward = this.rewarder.step(this.prevState, this.player.agent.orders[this.prevMemoryState[1]], this.temperature / 200);
			this.replayMemory?.append([...this.prevMemoryState, reward, true, null]);
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
			const playerState = this.player.getState();
			const selected = state.players[this.playerId].models[playerState.selected];
			const initialPosititon = sub(state.models[selected], order.vector);
			const currentPosition = state.models[selected];

			const center = div(state.battlefield.size, 2);
			const currentPositionDelta = len(sub(center, sub(currentPosition, center).map(Math.abs)));
			const initialPosititonDelta = len(sub(center, sub(initialPosititon, center).map(Math.abs)));
			reward += (currentPositionDelta - initialPosititonDelta);
		}
		return reward * epsilon;
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
	}
}

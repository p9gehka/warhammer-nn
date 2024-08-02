import { getRandomInteger } from '../static/utils/index.js';
import { eq } from '../static/utils/vec2.js';
import { Channel2Name } from '../static/environment/nn-input.js';
import { PlayerAgent } from '../static/players/player-agent.js';

export class StudentAgent extends PlayerAgent {
	playStep() {
		const prevState = this.env.getState();
		let orderIndex;
		let estimate = 0;
		const input = this.agent.getInput(prevState);

		if (Math.random() < this.epsilon) {
			orderIndex = getRandomInteger(0, this.agent.orders.all.length);
		} else if (input[Channel2Name.ObjectiveMarker].some(pos => eq(pos, input[0][0])) && Math.random() < this.epsilon) {
			orderIndex = 0;
		} else {
			let { orderIndex: stepOrderIndex, estimate } = this.agent.playStep(prevState);
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
	cumulativeReward = 0;
	primaryVP = 0;

	constructor(playerId, game, config = {}) {
		const { replayMemory, nn, epsilonInit, epsilonFinal, epsilonDecayFrames } = config
		this.game = game;

		this.replayMemory = replayMemory ?? null;
		this.frameCount = 0;
		this.epsilonInit = epsilonInit ?? 0.5;
		this.epsilonFinal = epsilonFinal ?? 0.01;
		this.epsilonDecayFrames = epsilonDecayFrames ?? 1e6;
		this.epsilonIncrement_ = (this.epsilonFinal - this.epsilonInit) / this.epsilonDecayFrames;
		this.epsilon = this.epsilonInit;

		this.player = new StudentAgent(playerId, game);
		this.rowPlayer = new PlayerAgent(playerId, game);

		this.setOnlineNetwork(nn);
	}
	setOnlineNetwork(nn) {
		this.player.agent.onlineNetwork = nn;
	}
	getOnlineNetwork(nn) {
		return this.player.agent.onlineNetwork;
	}
	getCumulativeReward() {
		return this.cumulativeReward;
	}
	playStep() {
		const { orders, height, width, channels } = this.game;
		this.frameCount++;
		this.epsilon = this.frameCount >= this.epsilonDecayFrames ?
			this.epsilonFinal :
			this.epsilonInit + this.epsilonIncrement_ * this.frameCount;
		const prevState = this.game.getState();
		const input = this.player.agent.getInput(prevState);

		if (this.prevState !== null) {
			this.replayMemory?.append([...this.prevState, false, input]);
		}
		let epsilon = this.epsilon;
		const result = this.player.playStep()
		let reward = -0.5;
		if (result[2].orderIndex === 0) {
			reward += this.primaryReward();
		}

		this.cumulativeReward += reward;
		this.prevState = [input, result[2].orderIndex, reward];
		return result;
	}

	reset() {
		this.stepAttemp = 0;
		this.prevState = null;
		this.game.reset();
		this.player.reset();
		this.rowPlayer.reset();
		this.cumulativeReward = 0;
		this.primaryVP = 0;
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

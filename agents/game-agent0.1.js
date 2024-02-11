import { createDeepQNetwork } from '../dqn/dqn.js';
import { getRandomInteger } from '../static/utils//index.js';
import { getStateTensor } from './utils.js';
import { Action } from '../environment/player-environment.js';
import { getTF } from '../dqn/utils.js';

const tf = await getTF();

export class GameAgent {
	orders = {};
	prevState = null;
	constructor(game, config = {}) {
		const { replayMemory, nn = [], epsilonInit, epsilonFinal, epsilonDecayFrames } = config
		this.game = game;

		this.onlineNetwork = nn[0] ?? createDeepQNetwork(game.orders.all.length, game.height, game.width, game.channels.length);
		this.targetNetwork = nn[1] ?? createDeepQNetwork(game.orders.all.length, game.height, game.width, game.channels.length);

		this.targetNetwork.trainable = false;
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

		const input = this.game.getInput();
		if (this.prevState !== null) {
			this.replayMemory?.append([...this.prevState, false, input]);
		}
		let epsilon = this.epsilon;
		let order = orders[Action.NextPhase][0];
		let orderIndex;

		if (Math.random() < this.epsilon) {
			orderIndex = this.getOrderRandomIndex();
		} else {
			tf.tidy(() => {
				const inputTensor = getStateTensor([input], height, width, channels);
				const predictions = this.onlineNetwork.predict(inputTensor);
				orderIndex = predictions.argMax(-1).dataSync()[0];
			});
		}

		order = orders.all[orderIndex];
		const [order_, state, reward] = this.game.step(order);
		this.prevState = [input, orderIndex, reward];

		return [order_, state, reward];
	}
	awarding() {
		const reward = this.game.awarding();
		const nextInput = this.game.getInput();
		if (this.replayMemory !== null && this.prevState !== null) {
			const [input, orderIndex] = this.prevState;
			this.replayMemory?.append([input, orderIndex, reward, true, nextInput]);
		}
	}
	reset() {
		this.prevState = null;
		this.game.reset();
	}
}

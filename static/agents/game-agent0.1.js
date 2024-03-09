import { getTF } from '../utils/get-tf.js';

import { getRandomInteger } from '../utils/index.js';
import { getStateTensor } from '../utils/get-state-tensor.js';
import { Action } from '../environment/orders.js';

const tf = await getTF();

export class GameAgent {
	orders = {};
	prevState = null;

	constructor(game, config = {}) {
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

	getAvailableMoveArgMax() {
		const { selected } = this.game.getState();
		const state = this.game.env.getState();
		const allOrders = this.game.orders.all;

		return tf.tensor2d(
			Array(allOrders.length).fill(-Infinity).map((v, i) => {
				return allOrders[i].expense <= state.modelsStamina[selected] ? 0 : v;
			}),
			[1, allOrders.length]
		);
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
		let orderIndex;
		if (Math.random() < this.epsilon) {
			orderIndex = this.getOrderRandomIndex();
		} else {
			tf.tidy(() => {
				const inputTensor = getStateTensor([input], height, width, channels);
				const indexesArgMax = this.getAvailableMoveArgMax();
				const predictions = this.onlineNetwork.predict(inputTensor);
				orderIndex = tf.add(predictions, indexesArgMax).argMax(-1).dataSync()[0];
			});
		}

		const order = orders.all[orderIndex];

		let [order_, state, reward] = this.game.step(order);
		const { selected } = this.game.getState();
		if(state.modelsStamina[selected] === 0 || order.expense === 0) {
			[,state,] = this.game.step({ action: Action.NextPhase });
		}

		this.prevState = [input, orderIndex, reward];
		return [order_, state, reward];
	}
	awarding() {
		const reward = this.game.awarding();
		const nextInput = this.game.getInput();
		if (this.replayMemory !== null && this.prevState !== null) {
			const [input, orderIndex] = this.prevState;
			this.replayMemory?.append([input, orderIndex, reward, this.game.loose(), nextInput]);
		}
	}
	reset() {
		this.prevState = null;
		this.game.reset();
		this.checkSize();
	}
	checkSize() {
		const [_, height, width] = this.onlineNetwork.inputs[0].shape;
		const [fieldHeight, fieldWidth] = this.game.env.battlefield.size;
		if (fieldHeight !== height || fieldWidth !== width) {
			console.warn(`!!!!Map size and Network input are inconsistent: ${[fieldHeight, fieldWidth]} !== ${[height, width]}!!!`)
		}
	}
}

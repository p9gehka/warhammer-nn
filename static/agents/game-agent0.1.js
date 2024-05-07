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

	getOrderRandomIndex() {
		return getRandomInteger(0, this.game.orders.all.length);
	}

	playStep() {
		const { orders, height, width, channels } = this.game;
		const { selected } = this.game.getState();
		const initState = this.game.env.getState();
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
				const predictions = this.onlineNetwork.predict(inputTensor);
				orderIndex = predictions.argMax(-1).dataSync()[0]
			});
		}

		let [order_, state, reward] = this.game.step(orders.all[orderIndex]);

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
	dispose() {
		this.onlineNetwork.dispose();
	}
}

import { createDeepQNetwork } from '../dqn/dqn.js';
import { getRandomInteger } from '../static/utils//index.js';
import { getStateTensor } from './utils.js';
import { Action } from '../environment/player-environment.js';
import { getTF  } from '../dqn/utils.js';

let tf = await getTF();

export class GameAgent {
	orders = {};
	prevState = null;
	constructor(game, config = {}) {
		const { replayMemory, nn = [], epsilonInit, epsilonFinal } = config
		this.game = game;

		this.onlineNetwork = nn[0] ?? createDeepQNetwork(game.orders.all.length, game.height, game.width, game.channels.length);
		this.targetNetwork = nn[1] ?? createDeepQNetwork(game.orders.all.length, game.height, game.width, game.channels.length);

		this.targetNetwork.trainable = false;
		this.replayMemory = replayMemory ?? null;
		this.frameCount = 0;
		this.epsilonInit = epsilonInit ?? 0.5;
		this.epsilonFinal = epsilonFinal ?? 0.01;
		this.epsilonDecayFrames = 1e6;
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
	trainOnReplayBatch(batchSize, gamma, optimizer) {
		// Get a batch of examples from the replay buffer.
		const { width, height, orders, channels } = this.game;
		if (this.replayMemory === null) {
			throw new Error(`trainOnReplayBatch without replayMemory`);
		}
		const batch = this.replayMemory.sample(batchSize);

		const lossFunction = () => tf.tidy(() => {
			const stateTensor = getStateTensor(batch.map(example => example[0]), height, width, channels);
			const actionTensor = tf.tensor1d(batch.map(example => example[1]), 'int32');

			const qs = this.onlineNetwork.apply(stateTensor, {training: true}).mul(tf.oneHot(actionTensor, orders.all.length)).sum(-1);

			const rewardTensor = tf.tensor1d(batch.map(example => example[2]));
			const nextStateTensor = getStateTensor(batch.map(example => example[4]), height, width, channels);

			const nextMaxQTensor = this.targetNetwork.predict(nextStateTensor).max(-1);
			const doneMask = tf.scalar(1).sub(
				tf.tensor1d(batch.map(example => example[3])).asType('float32'));
			const targetQs = rewardTensor.add(nextMaxQTensor.mul(doneMask).mul(gamma));
			return tf.losses.meanSquaredError(targetQs, qs);
		});

		// Calculate the gradients of the loss function with repsect to the weights
		// of the online DQN.
		const grads = tf.variableGrads(lossFunction);
		// Use the gradients to update the online DQN's weights.
		optimizer.applyGradients(grads.grads);
		tf.dispose(grads);
		// TODO(cais): Return the loss value here?
	}
}

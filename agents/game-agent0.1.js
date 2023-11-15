
import { eq } from '../static/utils/vec2.js';
import { createDeepQNetwork } from '../dqn/dqn.js';
import { getRandomInteger } from '../static/utils//index.js';
import { getStateTensor } from './utils.js';
import { Action, Channel2Name, Channel1Name } from '../environment/player-environment.js';
import { copyWeights } from '../dqn/dqn.js';
import { getTF  } from '../dqn/utils.js';

let tf = await getTF();


export class GameAgent {
	orders = {};
	prevOrderIndex = null;
	constructor(game, config = {}) {
		const { replayMemory, nn = [], epsilonInit, actionsProb } = config
		this.actionsProb = actionsProb ?? {};
		this.game = game;

		this.onlineNetwork = nn[0] ?? createDeepQNetwork(game.orders.all.length, game.height, game.width, game.channels);
		this.targetNetwork = nn[1] ?? createDeepQNetwork(game.orders.all.length, game.height, game.width, game.channels);

		this.targetNetwork.trainable = false;
		this.replayMemory = replayMemory ?? null;
		this.frameCount = 0;
		this.epsilonInit = epsilonInit ?? 0.5;
		this.epsilonFinal = 0.01;
		this.epsilonDecayFrames = 3e5 
		this.epsilonIncrement_ = (this.epsilonFinal - this.epsilonInit) / this.epsilonDecayFrames;
		this.epsilon = this.epsilonInit;
	}

	getAvailableIndexes() {
		const { orders } = this.game;
		const input = this.game.getInput();
		const selected = xy => eq(xy, input[Channel2Name.Selected].at(0));

		if (input[Channel2Name.Selected].length === 0) {
			return orders.selectIndexes;
		}

		if (input[Channel1Name.SelfModelAvailableToMove].some(selected)) {
			return orders.selectAndMoveIndexes;
		}

		if (input[Channel1Name.SelfModelAvailableToShoot].some(selected)) {
			return orders.selectAndShootIndexes;
		}

		if (input[Channel1Name.SelfModelAvailableToMove].length === 0 && input[Channel1Name.SelfModelAvailableToShoot].length === 0) {
			return [orders.nextPhaseIndex];
		}

		return orders.selectIndexes;
	}

	getOrderRandomIndex() {
		const indexes = this.getAvailableIndexes();
		return indexes[getRandomInteger(0, indexes.length)]
	}
	getIndexesArgMax() {
		const indexesArgMax = Array(this.game.orders.all.length).fill(0);
		this.getAvailableIndexes().forEach(i => indexesArgMax[i] = 1);
		return indexesArgMax;
	}
	playStep() {
		const { orders, height, width, channels } = this.game;
		this.frameCount++;
		this.epsilon = this.frameCount >= this.epsilonDecayFrames ?
		this.epsilonFinal :
		this.epsilonInit + this.epsilonIncrement_  * this.frameCount;

		const input = this.game.getInput();
		let epsilon = this.epsilon;
		let order = orders[Action.NextPhase][0];
		let rawOrderIndex;
		let orderIndex;

		if (Math.random() < this.epsilon) {
			rawOrderIndex = orderIndex = this.getOrderRandomIndex();
		} else {
			tf.tidy(() => {
				const inputTensor = getStateTensor([input], height, width, channels);
				const indexesArgMax = this.getIndexesArgMax();
				const predictions = this.onlineNetwork.predict(inputTensor);
				rawOrderIndex = predictions.clone().argMax(-1).dataSync()[0];
				orderIndex = tf.mul(predictions, tf.tensor2d(indexesArgMax, [1, 33])).argMax(-1).dataSync()[0];
			});
		}

		if (orderIndex !== rawOrderIndex) {
			if (this.needSave(orderIndex)) {
				this.replayMemory?.append([input, rawOrderIndex, 0, false, input]);
			}
		}

		if (orderIndex !== orders.nextPhaseIndex && orderIndex === this.prevOrderIndex) {
			if (this.needSave(orderIndex)) {
				this.replayMemory?.append([input, orderIndex, 0, false, input]);
			}
			orderIndex = this.getOrderRandomIndex();
		}

		order = orders.all[orderIndex];
		this.prevOrderIndex = orderIndex;
		const [order_, state, reward] = this.game.step(order);
		const nextInput = this.game.getInput();
		const loose = state.done && !this.game.win();
		if (this.needSave(orderIndex) || loose || reward > 1) {
			this.replayMemory?.append([input, orderIndex, reward, loose, nextInput]);
		}
		return [order_, state, reward];
	}
	needSave(orderIndex) {
		if (orderIndex in this.actionsProb) {
			return this.actionsProb[orderIndex] > Math.random();
		}
		return true
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
			const loosMask = tf.scalar(1).sub(tf.tensor1d(batch.map(example => example[3])).asType('float32'));
			const targetQs = rewardTensor.add(nextMaxQTensor.mul(loosMask).mul(gamma));
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

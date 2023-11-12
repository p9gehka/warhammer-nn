
import { eq } from '../static/utils/vec2.js';
import { createDeepQNetwork } from '../dqn/dqn.js';
import { getRandomInteger } from '../static/utils//index.js';
import { Orders, getStateTensor } from './utils.js';
import { Action, Channel3Name, Channel2Name, Channel1Name } from '../environment/player-environment.js';
import { copyWeights } from '../dqn/dqn.js';
import { getTF  } from '../dqn/utils.js';

let tf = await getTF();


export class GameAgent {
	orders = [];
	attempts = 0;
	prevOrderIndex = null;
	constructor(game, config = {}) {
		const { replayMemory, nn } = config
		this.game = game;
		this.orders = (new Orders(this.game.env.players[this.game.playerId].models.length, this.game.env.players[this.game.enemyId].models.length)).getOrders();

		this.onlineNetwork = nn ? nn[0] : createDeepQNetwork(game.height, game.width, game.channels, this.orders.all.length);
		this.targetNetwork = nn ? nn[1] : createDeepQNetwork(game.height, game.width, game.channels, this.orders.all.length);

		this.targetNetwork.trainable = false;
		this.replayMemory = replayMemory ?? null;
		this.frameCount = 0;
		this.epsilonInit = 0.5;
		this.epsilonFinal = 0.01;
		this.epsilonDecayFrames = 3e5 
		this.epsilonIncrement_ = (this.epsilonFinal - this.epsilonInit) / this.epsilonDecayFrames;
		this.epsilon = this.epsilonInit;
	}
	reset() {
		this.attempts = 0;
	}
	getAvailableIndexes() {
		const input = this.game.getInput();
		const selected = xy => eq(xy, input[Channel3Name.Selected].at(0));

		if (input[Channel3Name.Selected].length === 0) {
			return this.orders.selectIndexes;
		}

		if (input[Channel1Name.SelfModelAvailableToMove].some(selected)) {
			return this.orders.selectAndMoveIndexes;
		}

		if (input[Channel1Name.SelfModelAvailableToShoot].some(selected)) {
			return this.orders.selectAndShootIndexes;
		}

		if (input[Channel1Name.SelfModelAvailableToMove].length === 0 && input[Channel1Name.SelfModelAvailableToShoot].length === 0) {
			return [this.orders.nextPhaseIndex];
		}

		return this.orders.selectIndexes;
	}

	getOrderRandomIndex() {
		const indexes = this.getAvailableIndexes();
		return indexes[getRandomInteger(0, indexes.length)]
	}
	getIndexesArgMax() {
		const indexesArgMax = Array(this.orders.all.length).fill(0);
		this.getAvailableIndexes().forEach(i => indexesArgMax[i] = 1);
		return indexesArgMax;
	}
	playStep() {
		this.frameCount++;
		this.epsilon = this.frameCount >= this.epsilonDecayFrames ?
		    this.epsilonFinal :
		    this.epsilonInit + this.epsilonIncrement_  * this.frameCount;

		const input = this.game.getInput();
		let epsilon = this.epsilon;
		let order = this.orders[Action.NextPhase][0];
		let argMaxIndex;
		let orderIndex;

		this.attempts++;
		if (Math.random() < this.epsilon) {
			argMaxIndex = orderIndex = this.getOrderRandomIndex();
		} else {
			tf.tidy(() => {
				const inputTensor = getStateTensor([input], this.game.height, this.game.width, this.game.channels);
				const indexesArgMax = this.getIndexesArgMax();
				orderIndex = this.onlineNetwork.predict(inputTensor)
				argMaxIndex = orderIndex.clone().argMax(-1).dataSync()[0];
				orderIndex = tf.mul(orderIndex, tf.tensor2d(indexesArgMax, [1, 33])).argMax(-1).dataSync()[0];
			});
		}

		if (orderIndex !== this.orders.nextPhaseIndex && orderIndex === this.prevOrderIndex) {
			this.replayMemory?.append([input, orderIndex, 0, false, input]);
			orderIndex = this.getOrderRandomIndex();
		}

		if (orderIndex !== argMaxIndex) {
			this.replayMemory?.append([input, argMaxIndex, 0, false, input]);
		}

		order = this.orders.all[orderIndex];
		this.prevOrderIndex = orderIndex;

		const [order_, state, reward] = this.game.step(order);
		const nextInput = this.game.getInput();
		const loss = state.done && !this.game.win();
		this.replayMemory?.append([input, orderIndex, reward, loss, nextInput]);
		return [order_, state, reward];
	}

	trainOnReplayBatch(batchSize, gamma, optimizer) {
		// Get a batch of examples from the replay buffer.
		if (this.replayMemory === null) {
			throw new Error(`trainOnReplayBatch without replayMemory`);
		}
		const batch = this.replayMemory.sample(batchSize);

		const lossFunction = () => tf.tidy(() => {
			const stateTensor = getStateTensor(batch.map(example => example[0]), this.game.height, this.game.width, this.game.channels);
			const actionTensor = tf.tensor1d(batch.map(example => example[1]), 'int32');

			const qs = this.onlineNetwork.apply(stateTensor, {training: true}).mul(tf.oneHot(actionTensor, this.orders.all.length)).sum(-1);

			const rewardTensor = tf.tensor1d(batch.map(example => example[2]));
			const nextStateTensor = getStateTensor(batch.map(example => example[4]), this.game.height, this.game.width, this.game.channels);

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

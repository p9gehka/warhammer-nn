import { getTF } from '../static/utils/get-tf.js';
import { getStateTensor } from '../static/utils/get-state-tensor.js';
import { createDeepQNetwork } from '../dqn/dqn.js';
import { copyWeights } from '../dqn/dqn.js';
const tf = await getTF();

export class Trainer {
	constructor(cascad, config = {}) {
		const { replayMemory, nn, targetNN } = config
		this.game = cascad[0];
		this.replayMemory = replayMemory;
		this.onlineNetwork = nn ?? createDeepQNetwork(this.game.orders.length, this.game.height, this.game.width, this.game.channels.length);
		this.targetNetwork = null;
		/* this.targetNetwork.trainable = false not work why?? */
	}
	async createTargetNetwork() {
		this.targetNetwork?.dispose();
		this.targetNetwork = await tf.models.modelFromJSON({
			modelTopology: this.onlineNetwork.toJSON(null, false)
		});
		this.copyWeights();
	}
	copyWeights() {
		copyWeights(this.targetNetwork, this.onlineNetwork);
	}
	trainOnReplayBatch(batchSize, gamma, optimizer) {
		// Get a batch of examples from the replay buffer.
		const { width, height, orders, channels } = this.game;
		if (this.replayMemory === null) {
			throw new Error(`trainOnReplayBatch without replayMemory`);
		}
		const batch = this.replayMemory.sample(batchSize);

		const lossFunction = () => tf.tidy(() => {
			const stateTensor = getStateTensor(batch.map(example => example[0]), width, height, channels);
			const actionTensor = tf.tensor1d(batch.map(example => example[1]), 'int32');

			const qs = this.onlineNetwork.apply(stateTensor, {training: true}).mul(tf.oneHot(actionTensor, orders.length)).sum(-1);

			const rewardTensor = tf.tensor1d(batch.map(example => example[2]));
			const nextStateTensor = getStateTensor(batch.map(example => example[4]), width, height, channels);

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

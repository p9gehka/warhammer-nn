import { getTF } from '../static/utils/get-tf.js';
const tf = await getTF();

export function createSLNetwork(numActions, h, w, c) {
	if (!(Number.isInteger(h) && h > 0)) {
		throw new Error(`Expected height to be a positive integer, but got ${h}`);
	}
	if (!(Number.isInteger(w) && w > 0)) {
		throw new Error(`Expected width to be a positive integer, but got ${w}`);
	}
	if (!(Number.isInteger(numActions) && numActions > 1)) {
		throw new Error(
				`Expected numActions to be a integer greater than 1, ` +
				`but got ${numActions}`);
	}
	const totalRounds = 5
	const inputShape = [h, w, c];
	const inputConv2d = tf.input({shape: inputShape, name: 'sl-input1'});
	const inputDense = tf.input({shape: [totalRounds]});
  let conv2d = tf.layers.conv2d({ filters: 8, kernelSize: 4, activation: 'relu', name: 'sl-conv2d1' }).apply(inputConv2d);
  conv2d = tf.layers.batchNormalization({ name: 'sl-batchNormalisation1' }).apply(conv2d);
  conv2d = tf.layers.conv2d({ filters: 8, kernelSize: 4, activation: 'relu',  name: 'sl-conv2d2' }).apply(conv2d);
  conv2d = tf.layers.batchNormalization({ name: 'sl-batchNormalisation2' }).apply(conv2d);

	let conv2dOut = tf.layers.flatten().apply(conv2d);
	const concatinate = tf.layers.concatenate().apply([conv2dOut, inputDense]);
	let output = tf.layers.dense({units: numActions, activation: 'softmax'}).apply(concatinate);
	
	const model = tf.model({ inputs: [inputConv2d, inputDense], outputs: output });

	return model;
}

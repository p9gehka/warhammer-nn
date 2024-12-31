/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { getTF } from '../static/utils/get-tf.js';
const tf = await getTF();

export function createDeepQNetwork(numActions, h, w, c, { addSoftmaxLayer } = { addSoftmaxLayer: false}) {
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
	const inputConv2d = tf.input({shape: inputShape});
	const inputDense = tf.input({shape: [totalRounds]});
	let conv2d = tf.layers.conv2d({ filters: 8, kernelSize: 4, activation: 'relu'}).apply(inputConv2d);
	conv2d = tf.layers.conv2d({ filters: 16, kernelSize: 4, activation: 'relu' }).apply(conv2d);
	conv2d = tf.layers.conv2d({ filters: 16, kernelSize: 4, activation: 'relu' }).apply(conv2d);
	conv2d = tf.layers.conv2d({ filters: 16, kernelSize: 4, activation: 'relu'}).apply(conv2d);
	conv2d = tf.layers.batchNormalization().apply(conv2d);
	let conv2dOut = tf.layers.flatten().apply(conv2d);
	const concatinate = tf.layers.concatenate().apply([conv2dOut, inputDense]);
	let mlp = tf.layers.dense({units: 768, activation: 'relu'}).apply(concatinate);
	mlp = tf.layers.dropout({ rate: 0.5 }).apply(mlp);
	let output = tf.layers.dense({units: numActions}).apply(mlp);

	if (addSoftmaxLayer) {
		output = tf.layers.softmax().apply(output)
	}
	const model = tf.model({ inputs: [inputConv2d, inputDense], outputs: output });

	return model;
}

/**
 * Copy the weights from a source deep-Q network to another.
 *
 * @param {tf.LayersModel} destNetwork The destination network of weight
 *   copying.
 * @param {tf.LayersModel} srcNetwork The source network for weight copying.
 */
export function copyWeights(destNetwork, srcNetwork) {
  // https://github.com/tensorflow/tfjs/issues/1807:
  // Weight orders are inconsistent when the trainable attribute doesn't
  // match between two `LayersModel`s. The following is a workaround.
  // TODO(cais): Remove the workaround once the underlying issue is fixed.
  let originalDestNetworkTrainable;
  if (destNetwork.trainable !== srcNetwork.trainable) {
    originalDestNetworkTrainable = destNetwork.trainable;
    destNetwork.trainable = srcNetwork.trainable;
  }

  srcNetwork.layers.forEach((layer, i) => {
    if (destNetwork.layers[i] !== undefined) {
      destNetwork.layers[i].setWeights(layer.getWeights())
    }
  });

  // Weight orders are inconsistent when the trainable attribute doesn't
  // match between two `LayersModel`s. The following is a workaround.
  // TODO(cais): Remove the workaround once the underlying issue is fixed.
  // `originalDestNetworkTrainable` is null if and only if the `trainable`
  // properties of the two LayersModel instances are the same to begin
  // with, in which case nothing needs to be done below.
  if (originalDestNetworkTrainable != null) {
    destNetwork.trainable = originalDestNetworkTrainable;
  }
}
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

export function createDeepQNetwork(numActions, h, w, c) {
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

	const model = tf.sequential();
	model.add(tf.layers.conv2d({filters: 64, kernelSize: 8,strides: 2, activation: 'relu', inputShape: [h, w, c] }));
	model.add(tf.layers.batchNormalization());
	model.add(tf.layers.conv2d({filters: 128, kernelSize: 4,strides: 1, activation: 'relu'}));
	model.add(tf.layers.batchNormalization());
	model.add(tf.layers.conv2d({filters: 128, kernelSize: 3, strides: 1, activation: 'relu' }));
	model.add(tf.layers.flatten());
	model.add(tf.layers.dense({units: 100, activation: 'relu'}));
	model.add(tf.layers.dropout({rate: 0.25}));
	model.add(tf.layers.dense({units: numActions}));
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
	destNetwork.setWeights(srcNetwork.getWeights());
}

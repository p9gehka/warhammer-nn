/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
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
import * as fs from 'fs';
import shelljs from 'shelljs';
import { getTF } from '../static/utils/get-tf.js';
import { model } from './model.js'
import { getDataset, trainModelUsingFitDataset } from './supervised-train.js';
import { sendDataToTelegram, sendMessage } from '../visualization/utils.js';
const tf = await getTF();

async function run(epochs, batchEpochs, batchSize, savePath) {
	model.summary();

	const accuracyLogs = [];
	const lossLogs = [];

	for (let i = 1; i < epochs; i++) {
		console.log(`New Data Epochs ${i}/${epochs}`);
		const dataset = getDataset().batch(batchSize);
		const result = await trainModelUsingFitDataset(model, dataset, batchEpochs, batchSize);
		result.history.val_acc.forEach((val_acc, epoch) => accuracyLogs.push({ epoch: epoch * i, val_acc }));
		result.history.val_loss.forEach((val_loss, epoch) => lossLogs.push({ epoch: epoch * i, val_loss }));
		if (savePath != null) {
			if (!fs.existsSync(savePath)) {
				shelljs.mkdir('-p', savePath);
			}
			await model.save(`file://${savePath}`);
			console.log(`Saved DQN to ${savePath}`);
		}
	}

	await sendConfigMessage(model);
	await sendDataToTelegram(lossLogs);
	await sendDataToTelegram(accuracyLogs);

	process.exit(0);
}

async function sendConfigMessage(model) {
	await sendMessage(
		model.layers.map(layer => `${layer.name.split('_')[0]}{${ ['filters', 'kernelSize', 'units', 'rate'].map(filter => layer[filter] ? `filter: ${layer[filter]}` : '').filter(v=>v !=='') }}` ).join('->')
	);
}

run(100, 2, 256, './models/supervised-dqn/');

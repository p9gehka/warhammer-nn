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
import { model as modelImport } from './model.js'
import { getDataset } from '../static/utils/get-dataset.js';
import { sendDataToTelegram, sendMessage } from '../visualization/utils.js';
import { testReward } from '../tests/test-reward.js';
const tf = await getTF();

export async function run(epochs, batchesPerEpoch, savePath, nn) {
	const model = nn ?? modelImport;
	model.summary();

	const optimizer = tf.train.adam(0.001);
	model.compile({
		optimizer: optimizer,
		loss: 'categoricalCrossentropy',
		metrics: ['accuracy'],
	});


	const accuracyLogs = [];
	const lossLogs = [];
	const averageVPLogs = []
	let bestVal_loss = 10000;
	let bestAverageVP = 0;

	let dataset = getDataset().batch(batchesPerEpoch);

	const fitDatasetArgs = {
		batchSize: 32,
		batchesPerEpoch,
		epochs,
		validationData: dataset,
		validationBatches: 50,
		callbacks: {
			onEpochEnd: async (epoch, { val_acc, val_loss }) => {
				console.log('Get Average reward...');
				const averageVP = await testReward(true, model);
				console.log(`averageVP: ${averageVP}, prevBestVp: ${bestAverageVP}, prevBestLoss: ${bestVal_loss}`);
				if (bestAverageVP < averageVP) {
					bestAverageVP = averageVP;
					if (savePath != null) {
						if (!fs.existsSync(savePath)) {
							shelljs.mkdir('-p', savePath);
						}
						await model.save(`file://${savePath}`);
						console.log(`Saved DQN to ${savePath}`);
					}
				}
				if (val_loss < bestVal_loss) {
					bestVal_loss = val_loss;
				}

				accuracyLogs.push({ epoch, val_acc });
				averageVPLogs.push({ epoch, averageVP });
				lossLogs.push({ epoch, val_loss });
			}
		}
	};

	await model.fitDataset(dataset, fitDatasetArgs);
	await sendConfigMessage(model);
	await sendMessage(`Best AverageVp: ${bestVal_loss}`)
	await sendDataToTelegram(lossLogs);
	await sendDataToTelegram(accuracyLogs);
	await sendDataToTelegram(averageVPLogs);
}


async function sendConfigMessage(model) {
	await sendMessage(
		model.layers.map(layer => `${layer.name.split('_')[0]}{${ ['filters', 'kernelSize', 'units', 'rate'].map(filter => layer[filter] ? `${filter}: ${layer[filter]}` : '').filter(v=>v !=='') }}` ).join('->')
	);
}

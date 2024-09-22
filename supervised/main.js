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
import { getTF } from '../static/utils/get-tf.js';
import { model } from './model.js'
import { getDataset, trainModelUsingFitDataset } from './supervised-train.js';

const tf = await getTF();

async function run(epochs, batchSize) {
	model.summary();

	const dataset = getDataset().batch(batchSize);
	await trainModelUsingFitDataset(model, dataset, epochs, batchSize);
	 process.exit(0);
}

run(20, 768);

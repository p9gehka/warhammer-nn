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

import { getTF } from '../static/utils/get-tf.js';
import { createDeepQNetwork } from '../dqn/dqn.js';
import { MoveAgent } from '../static/agents/move-agent/move-center-agent.js';

const tf = await getTF();
export const model = createDeepQNetwork(MoveAgent.settings.orders.length, MoveAgent.settings.width, MoveAgent.settings.height, MoveAgent.settings.channels.length)

model.add(tf.layers.softmax());

const optimizer = tf.train.adam(0.0001);
model.compile({
  optimizer: optimizer,
  loss: 'categoricalCrossentropy',
  metrics: ['accuracy'],
});


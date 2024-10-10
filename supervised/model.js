import { getTF } from '../static/utils/get-tf.js';
import { createDeepQNetwork } from '../dqn/dqn.js';
import { MoveAgent } from '../static/agents/move-agent/move-to-object-agent.js';

const tf = await getTF();
export const model = createDeepQNetwork(MoveAgent.settings.orders.length, MoveAgent.settings.height, MoveAgent.settings.width, MoveAgent.settings.channels.length, { addSoftmaxLayer: true });
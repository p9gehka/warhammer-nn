import { getTF } from '../static/utils/get-tf.js';
import { createSLNetwork } from '../dqn/sl-nn.js';
import { MoveAgent } from '../static/agents/move-agent/move-to-object-agent.js';

const tf = await getTF();
export const model = createSLNetwork(MoveAgent.settings.orders.length, MoveAgent.settings.height, MoveAgent.settings.width, MoveAgent.settings.channels.length);

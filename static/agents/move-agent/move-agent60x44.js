import { MoveAgentBase } from './move-agent.js';
import { moveOrders } from './move-orders.js';
import { channels } from '../../environment/nn-input.js';

export class MoveAgent extends MoveAgentBase {
	static settings = { width: 60, height: 44, orders: moveOrders, channels: channels }
	width = MoveAgent.settings.width;
	height = MoveAgent.settings.height;
	channels = MoveAgent.settings.channels;
	orders = MoveAgent.settings.orders;
}

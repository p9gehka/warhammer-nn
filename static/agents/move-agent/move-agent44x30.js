import { MoveAgentBase } from './move-agent.js';
import { Orders } from '../../environment/orders.js';
import { channels } from '../../environment/nn-input.js';

export class MoveAgent extends MoveAgentBase {
	static settings = { width: 44, height: 30, orders: new Orders().getOrders(), channels: channels }
	width = MoveAgent.settings.width;
	height = MoveAgent.settings.height;
	channels = MoveAgent.settings.channels;
	orders = MoveAgent.settings.orders;
}

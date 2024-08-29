import { MoveAgentBase } from './move-agent.js';
import { moveOrders } from './move-orders.js';
import { Channel0, Channel1, Channel2 } from '../../environment/nn-input.js';

export class MoveAgent extends MoveAgentBase {
	static settings = { width: 44, height: 30, orders: moveOrders, channels: [Channel0, Channel1, Channel2] }
	width = MoveAgent.settings.width;
	height = MoveAgent.settings.height;
	channels = MoveAgent.settings.channels;
	orders = MoveAgent.settings.orders;
	loadPath = `agents/move-agent/.model${this.width}x${this.height}x${this.channels.length}/model.json`;
}

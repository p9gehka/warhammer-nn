import { ShootAgentBase } from './shoot-agent.js';
import { shootOrders } from './shoot-orders.js';
import { channels } from '../../environment/nn-input.js';

export class ShootAgent extends ShootAgentBase {
	static settings = { width: 60, height: 44, orders: shootOrders, channels: channels }
	width = ShootAgent.settings.width;
	height = ShootAgent.settings.height;
	channels = ShootAgent.settings.channels;
	orders = ShootAgent.settings.orders;
}

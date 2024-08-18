import { BaseAction } from '../environment/warhammer.js';
import { moveOrders } from '../agents/move-agent/move-orders.js';

export const PlayerAction = {
	Select: 'SELECT',
	...BaseAction,
}

export { moveOrders };
export const playerOrders = [...moveOrders];

Array(2).fill(0).map((_, id) => {
	playerOrders.push({ action: PlayerAction.Select, id });
});

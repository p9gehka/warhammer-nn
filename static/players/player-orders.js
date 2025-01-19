import { BaseAction } from '../environment/warhammer.js';
import { moveOrders } from '../agents/move-agent/move-orders.js';

export const PlayerAction = {
	Select: 'SELECT',
	PlayerNextPhase: 'PLAYER_NEXT_PHASE',
	...BaseAction,
}


export const playerOrders = [...moveOrders];
/*
Array(50).fill().map((_, id) => {
	playerOrders.push({ action: PlayerAction.Select, id });
});*/

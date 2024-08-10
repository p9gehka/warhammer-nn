import { BaseAction, Phase } from '../environment/warhammer.js';
import { moveOrders } from '../agents/move-agent/move-orders.js';

export const PlayerAction = {
	Select: 'SELECT',
	SetTarget: 'SET_TARGET',
	SelectWeapon: 'SELECT_WEAPON',
	...BaseAction,
}


export const playerOrders = [...moveOrders];

Array(50).fill().map((_, id) => {
	playerOrders.push({ action: PlayerAction.Select, id });
});

Array(30).fill().map((_, id) => {
	playerOrders.push({ action: PlayerAction.SetTarget, id });
});

Array(10).fill().map((_, id) => {
	playerOrders.push({ action:PlayerAction.SelectWeapon, id });
});

playerOrders.push({ action: BaseAction.Shoot });

getPlayerOrders(phase) {
	if (phase === Phase.Command) {
		return [{ action: BaseAction.DiscardSecondary, id: 0 }, { action: BaseAction.DiscardSecondary, id: 1 }];
	}
}

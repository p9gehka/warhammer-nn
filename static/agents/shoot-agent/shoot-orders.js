import { BaseAction } from '../../environment/warhammer.js';


export const shootOrders = [{ action: BaseAction.NextPhase }];

new Array(17).fill(0).forEach((_, target) => {
	shootOrders.push({ action: BaseAction.Shoot, target });
});

import { BaseAction } from '../../environment/warhammer.js';


export const shootOrders = [{ action: BaseAction.NextPhase }];


[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].forEach((target) => {
	shootOrders.push({ action: BaseAction.Shoot, target });
});

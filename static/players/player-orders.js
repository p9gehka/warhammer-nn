import { BaseAction, Phase } from '../environment/warhammer.js';
import { DeployAction } from '../environment/deploy.js';
import { moveOrders } from '../agents/move-agent/move-orders.js';

export const PlayerAction = {
	Select: 'SELECT',
	SetTarget: 'SET_TARGET',
	SelectWeapon: 'SELECT_WEAPON',
	SetDiceSequence: 'SET_DICE_SEQUENCE',
	...BaseAction,
}

export const DeployPlayerAction = {
	SetX: 'SET_X',
	SetY: 'SET_Y',
	...DeployAction,
}

export const shootOrder = { action: BaseAction.Shoot };
export const nextPhaseOrder = { action: BaseAction.NextPhase };

export function getSetDiceSequenceOrder(sequence) {
	return { action: PlayerAction.SetDiceSequence, sequence };
}

export function getMoveOrders() {
	return moveOrders.filter(order => order.action === BaseAction.Move);
}
export function getDiscardMissionOrder(id) {
	return { action: BaseAction.DiscardSecondary, id };
}

export function getSelectModelOrder(id) {
	return { action: PlayerAction.Select, id }
}

export function getSelectWeaponOrder(id) {
	return { action: PlayerAction.SelectWeapon, id };
}

export function getSetTargetOrder(id) {
	return { action: PlayerAction.SetTarget, id };
}

export function getPlayerOrders(phase) {
	return [nextPhaseOrder];
}

export function getDeployModelOrders([x, y]) {
	return [
		{ action: DeployPlayerAction.SetX, value: x },
		{ action: DeployPlayerAction.SetY, value: y },
		{ action: DeployAction.DeployModel },
	];
}

export const doneOrder = { action: DeployAction.Done };

import { BaseAction, Phase } from '../environment/warhammer.js';
import { DeployAction } from '../environment/deploy.js';
import { angleToVec2, round, add } from '../../utils/vec2.js';

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

/* `←``↑``→``↓``↖``↗``↘``↙`*/
const distances = [1,2,3, 6];
const distancesDiagonal = [1, 2, 4];
const distancesDiagonalExpense = [2, 3, 6];
const angles = [0, 90, 180, 270];

export const moveOrders = [{ action: BaseAction.NextPhase }];

angles.forEach((angle, i) => {
	for (let distance of distances) {
		moveOrders.push({ action: BaseAction.Move, vector: round(angleToVec2(distance, angle)), expense: distance });
	}

	distancesDiagonal.forEach((distance, ii) => {
		const vector1 = angleToVec2(distance, angle);
		const vector2 = angleToVec2(distance, angles[(i+1) % angles.length]);
		const vector = round(add(vector1, vector2));
		moveOrders.push({ action: BaseAction.Move, vector, expense: distancesDiagonalExpense[ii] });
	});
});


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

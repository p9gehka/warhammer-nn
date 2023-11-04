import { angleToVec2 } from '../static/utils/vec2.js';
import { Action } from '../environment/warhammer.js';
const models = [0, 1];
const distances = [0.25, 0.5, 0.75, 1];
const angles = [0, 45, 90, 180, 225 , 270, 315];

const targets = [0, 1];

export function getActions() {
	const moveActions = [{ action: Action.NextPhase }];
	const shootActions = [{ action: Action.NextPhase }];

	for (let model of models) {
		moveActions.push({ action: Action.Move, id:model, vector: [0, 0] });
		for (let distance of distances) {
			for (let angle of angles) {
				moveActions.push({ action:Action.Move, id:model, vector: angleToVec2 (distance, angle) });
			}
		}
	}
	for (let model of models) {
		for (let target of targets) {
			shootActions.push({ action: Action.Shoot, id:model, target });
		}
	}
	return [...moveActions, ...shootActions];
}
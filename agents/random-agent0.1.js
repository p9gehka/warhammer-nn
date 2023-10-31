import { rotatedDegrees, round } from '../static/utils/vec2.js';
import gameSettings from '../static/settings/game-settings0.1.json' assert { type: 'json' };
import { Action } from '../environment/warhammer.js';
const { battlefield } = gameSettings;

/**/

const models = [0, 1];
const distances = [0.25, 0.5, 0.75, 1];
const angles = [0, 45, 90, 180, 225 , 270, 315];

const targets = [0, 1]
const actions = [];

for (let model of models) {
	actions.push({ action: Action.Move, id:model, vector: [0, 0] });
	for (let distance of distances) {
		for (let angle of angles) {
			actions.push({ action:Action.Move, id:model, vector: toVector(distance, angle) });
		}
	}
	for (let target of targets) {
		actions.push({ action: Action.Shoot, id:model, target });
	}
}

// соперник cвой (ходил. неходил)  * стелс страйктим или точка
//[44 * 60 * 4 * 2)]

export class RandomAgent {
	playStep() {
		return actions[Math.floor(Math.random() * actions.length)]
	}
}

function toVector(distance, angle) {
	return distance === 0 ? [0, 0] : rotatedDegrees([0, distance], angle)
}
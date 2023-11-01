import { rotatedDegrees } from '../static/utils/vec2.js';
import gameSettings from '../static/settings/game-settings0.1.json' assert { type: 'json' };
import { Action } from '../environment/warhammer.js';
import { Entities  } from '../environment/player-environment.js';

const { battlefield } = gameSettings;
/**/

const models = [0, 1];
const distances = [0.25, 0.5, 0.75, 1];
const angles = [0, 45, 90, 180, 225 , 270, 315];

const targets = [0, 1];
const moveActions = [];

for (let model of models) {
	moveActions.push({ action: Action.Move, id:model, vector: [0, 0] });
	for (let distance of distances) {
		for (let angle of angles) {
			moveActions.push({ action:Action.Move, id:model, vector: toVector(distance, angle) });
		}
	}
}

const shootActions = [];
for (let model of models) {
	for (let target of targets) {
		shootActions.push({ action: Action.Shoot, id:model, target });
	}
}
// соперник cвой (ходил. неходил)  * стелс страйктим или точка
//[44 * 60 * 4 * 2)]

export class RandomAgent {
	actions = []
	playStep(input, units) {
		if (input.flat().find(v => v === Entities.SelfStrikeTeam || v === Entities.SelfStealth)) {
			return moveActions[Math.floor(Math.random() * moveActions.length)]
		}
		if (input.flat().find(v => v === Entities.SelfStrikeTeamMoved || v === Entities.SelfStealthMoved)) {
			return shootActions[Math.floor(Math.random() * shootActions.length)]
		}
		return { action: Action.NextPhase };
	}
}

function toVector(distance, angle) {
	return distance === 0 ? [0, 0] : rotatedDegrees([0, distance], angle)
}
import { rotatedDegrees, round } from '../static/utils/vec2.js';
import gameSettings from '../static/settings/game-settings0.1.json' assert { type: 'json' };
const { battlefield } = gameSettings;

/**/

const models = [0, 1];
const distances = [0.25, 0.5, 0.75, 1];
const angles = [0, 45, 90, 180, 225 , 270, 315];

const targets = [2, 3]
const actions = [];

for (let model of models) {
	actions.push(['MOVE', model, [0, 0]]);
	for (let distance of distances) {
		for (let angle of angles) {
			actions.push(['MOVE', model, toVector(distance, angle)]);
		}
	}
	for (let target of targets) {
		actions.push(['SHOOT', model, target]);
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

const Entities = {
	Empyt: 0,
	Marker: 1,
	SelfStrikeTeam: 2,
	SelfStrikeTeamMoved: 3,
	SelfStrikeTeamShooted: 4,
	SelfStealth: 5,
	SelfStealthMoved: 6,
	SelfStealthShooted: 7,
	EnemyStrikeTeam: 8,
	EnemyStealth: 9
}

export function stateToInput44x30(state, playerId) {
	let input = []
	for (let i = 0; i < battlefield.size[1]; i++) {
		input[i] = Array(battlefield.size[0]).fill(Entities.Empty);
	}
	for (let [x, y] of battlefield.objective_marker) {
		input[y][x] = Entities.Marker;
	}

	for (let player of state.players) {
		for (let unit of player.units) {
			unit.models.forEach(modelId => {
				const model = state.models[modelId]
				if (model === null) {
					return;
				}
				const [x, y] = round(model);

				if (0 <= y && y < input.length && 0 <=x && x < input[y].length) {
					let entity = null;

					if (unit.playerId === playerId) {
						if (unit.name === 'strike_team') {
							if(state.availableToMove.includes(modelId)) {
								entity = Entities.SelfStrikeTeam;
							} else if(state.availableToShoot.includes(modelId)) {
								entity = Entities.SelfStrikeTeamMoved;
							} else {
								entity = Entities.SelfStrikeTeamShooted;
							}
						}

						if (unit.name === 'stealth_battlesuits') {
							if(state.availableToMove.includes(modelId)) {
								entity = Entities.SelfStealth;
							} else if(state.availableToShoot.includes(modelId)) {
								entity = Entities.SelfStealthMoved;
							} else {
								entity = Entities.SelfStealthShooted;
							}
						}
					}
					if (unit.playerId !== playerId) {
						if (unit.name === 'strike_team') {
							entity = Entities.EnemyStrikeTeam;
						}

						if (unit.name === 'stealth_battlesuits') {
							entity = Entities.EnemyStealth;
						}
					}
					if (entity !== null) {
						input[y][x] = entity;
					}
				}
			})
		}
	}

	return input;
}
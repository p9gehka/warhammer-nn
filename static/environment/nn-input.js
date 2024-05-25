import { Phase } from './warhammer.js';
import { len } from '../utils/vec2.js';

//{ Empty: 0 }
export const Channel0 = { 0: 1 };
export const Channel1 = { };
[0,1,2,3,4,5,6,7,8,9,10].forEach(v => { Channel1[`Stamina${v}`] = v; });

export const Channel2 = { ObjectiveMarker: 1 };

export const Channel0Name = {}, Channel1Name = {}, Channel2Name = {};

Object.keys(Channel0).forEach(name => Channel0Name[name] = name);
Object.keys(Channel1).forEach(name => Channel1Name[name] = name);
Object.keys(Channel2).forEach(name => Channel2Name[name] = name);

export const channels = [Channel0, Channel1, Channel2];
export function emptyInput() {
	const input = {};
	[...Object.keys(Channel0Name), ...Object.keys(Channel1Name), ...Object.keys(Channel2Name)].forEach(name => {
		input[name] = [];
	});
	return input;
}

const objectiveMemoized = {};

export function getInput(state) {
	const memoKey = state.battlefield.objective_marker.join();

	if (objectiveMemoized[memoKey] === undefined) {
		objectiveMemoized[memoKey] = []
		state.battlefield.objective_marker.forEach(([x, y]) => {
			const delta = state.battlefield.objective_marker_control_distance;
			for(let i = -delta; i <= delta; i++) {
				for(let ii = -delta; ii <= delta; ii++) {
					if (len([i, ii]) <= delta) {
						 objectiveMemoized[memoKey].push([x + i, y + ii]);
					}
				}
			}
		});
	}

	let objectiveMarkerInput = objectiveMemoized[memoKey];

	const input = emptyInput();
	input[Channel2Name.ObjectiveMarker] = objectiveMarkerInput;

	state.players.forEach((player, playerId) => {
		player.models.forEach((gameModelId, playerModelId) => {
			const xy = state.models[gameModelId]
			if (xy === null) { return; }

			let entity = null;

			if (playerId === state.player) {
				input[playerModelId] = [xy];
				if (state.phase === Phase.Movement) {
					entity = Channel1Name[`Stamina${Math.min(state.modelsStamina[gameModelId], 10)}`];
				}
			}

			if (entity !== null) {
				if (input[entity] === undefined) {
					input[entity] = [];
				}
				input[entity].push(xy)
			}
		});
	});
	return input;
}
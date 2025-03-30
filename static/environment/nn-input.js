import { Phase } from './warhammer.js';
import { len } from '../utils/vec2.js';
import { deployment } from  '../battlefield/deployment.js';

//{ Empty: 0 }
export const Channel0 = {};
const maxModels = 10;
new Array(maxModels).fill(0).forEach((_, v) => { Channel0[v] = 1 });
export const Channel1 = {};
const maxStamina = 10;
new Array(maxStamina).fill(0).forEach((_,v) => { Channel1[`Stamina${v}`] = v / maxStamina; });

export const Channel2 = { ObjectiveMarker: 1 };
export const Channel3 = {};

const maxModelsAtOrder = 3;
new Array(maxModelsAtOrder).fill(0).forEach((_, v) => { Channel3[`Order${v}`] = (v + 1) / maxModelsAtOrder; });

export const Channel0Name = {}, Channel1Name = {}, Channel2Name = {}, Channel3Name = {};

Object.keys(Channel0).forEach(name => Channel0Name[name] = name);
Object.keys(Channel1).forEach(name => Channel1Name[name] = name);
Object.keys(Channel2).forEach(name => Channel2Name[name] = name);
Object.keys(Channel3).forEach(name => Channel3Name[name] = name);

export const channels = [Channel0, Channel1, Channel2, Channel3];
export function emptyInput() {
	const input = {};
	[...Object.keys(Channel0Name), ...Object.keys(Channel1Name), ...Object.keys(Channel2Name), ...Object.keys(Channel3Name)].forEach(name => {
		input[name] = [];
	});
	return input;
}

const objectiveMemoized = {};

export function getInput(state, playerState) {
	const memoKey = state.battlefield.deployment;

	if (state.phase !== Phase.Movement) {
		console.log("getInput state.phase !== Phase.Movement");
	}

	if (deployment[memoKey] !== undefined && objectiveMemoized[memoKey] === undefined) {
		objectiveMemoized[memoKey] = [];
		const currentDeployment = new deployment[memoKey]();
		currentDeployment.objective_markers.forEach(([x, y]) => {
			const delta = currentDeployment.objective_marker_control_distance;
			for(let i = -delta; i <= delta; i++) {
				for(let ii = -delta; ii <= delta; ii++) {
					if (len([i, ii]) <= delta) {
						 objectiveMemoized[memoKey].push([x + i, y + ii]);
					}
				}
			}
		});
	}

	let objectiveMarkerInput = objectiveMemoized[memoKey].filter(([x, y]) => 0 <= x && x < state.battlefield.size[0] && 0 <= y && y < state.battlefield.size[1]);

	const input = emptyInput();
	input[Channel2Name.ObjectiveMarker] = objectiveMarkerInput;

	state.players.forEach((player, playerId) => {
		const totalPlayerModelNumber = player.models.length;
		player.models.forEach((gameModelId, playerModelId) => {
			const xy = state.models[gameModelId];
			if (xy === null) { return; }

			let entities = [];

			if (playerId === state.player) {
				input[playerModelId] = [xy];
				let order = 0;
				if (playerModelId >= playerState.selected) {
					order = Math.min(playerModelId - playerState.selected, maxModelsAtOrder - 1);
				} else {
					order = Math.min(totalPlayerModelNumber - playerState.selected + playerModelId, maxModelsAtOrder - 1);
				}

				const stamina = Math.min(state.modelsStamina[gameModelId], maxModels);

				entities.push(Channel3Name[`Order${order}`]);
				entities.push(Channel1Name[`Stamina${stamina}`]);
			}

			entities.forEach(entity => {
				if (input[entity] === undefined) {
					input[entity] = [];
				}
				input[entity].push(xy);
			});
		});
	});

	input.round = state.round;
	return input;
}
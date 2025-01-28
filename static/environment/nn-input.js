import { Phase } from './warhammer.js';
import { len } from '../utils/vec2.js';
import { deployment } from  '../battlefield/deployment.js';
import { terrain } from  '../battlefield/terrain.js';
import { Triangle } from '../utils/planimatrics/triangle.js';

//{ Empty: 0 }
export const Channel0 = {};
const maxModels = 10;
new Array(maxModels).fill(0).forEach((_, v) => { Channel0[`PlayerModel${v}`] = 1 });

export const Channel1 = {};

new Array(maxModels).fill(0).forEach((_,v) => { Channel1[`Stamina${v}`] = v / maxModels; });

export const Channel2 = {};
[1,2,3,4,5].forEach(v => { Channel2[`ObjectiveMarker${v}`] = v/5 })
export const Channel3 = {};

const maxModelsAtOrder = 3;
new Array(maxModelsAtOrder).fill(0).forEach((_, v) => { Channel3[`Order${v}`] = (v + 1) / maxModelsAtOrder; });

export const Channel4 = {};
new Array(17).fill(0).forEach((_, v) => { Channel4[`OpponentModel${v}`] = 1 });

export const ChannelTerrain = { Footprint: 1 };

export const Channel0Name = {}, Channel1Name = {}, Channel2Name = {}, Channel3Name = {}, Channel4Name = {}, ChannelTerrainName = {};

Object.keys(Channel0).forEach(name => Channel0Name[name] = name);
Object.keys(Channel1).forEach(name => Channel1Name[name] = name);
Object.keys(Channel2).forEach(name => Channel2Name[name] = name);
Object.keys(Channel3).forEach(name => Channel3Name[name] = name);
Object.keys(Channel4).forEach(name => Channel4Name[name] = name);
Object.keys(ChannelTerrain).forEach(name => ChannelTerrainName[name] = name);

export const channels = [Channel0, Channel1, Channel2, Channel3, Channel4, ChannelTerrain];
export function emptyInput() {
	const input = {};
	[
		...Object.keys(Channel0Name),
		...Object.keys(Channel1Name),
		...Object.keys(Channel2Name),
		...Object.keys(Channel3Name),
		...Object.keys(Channel4Name),
		...Object.keys(ChannelTerrainName)
	].forEach(name => {
		input[name] = [];
	});
	return input;
}

const objectiveMemoized = {};
const terrainMemoized = {};

export function getInput(state, playerState) {
	const memoKey = state.battlefield.deployment;
	const terrainMemoKey = state.battlefield.terrain;

	if (state.phase !== Phase.Movement) {
		console.log("getInput state.phase !== Phase.Movement");
	}

	if (deployment[memoKey] !== undefined && objectiveMemoized[memoKey] === undefined) {
		objectiveMemoized[memoKey] = [];
		const currentDeployment = new deployment[memoKey]();
		currentDeployment.objective_markers.forEach(([x, y], objectIndex) => {
			const delta = currentDeployment.objective_marker_control_distance;
			objectiveMemoized[memoKey][objectIndex] = []
			for(let i = -delta; i <= delta; i++) {
				for(let ii = -delta; ii <= delta; ii++) {
					if (len([i, ii]) <= delta) {
						const objectx = x + i;
						const objecty = y + ii;
						if (0 <= objectx && objectx < state.battlefield.size[0] && 0 <= objecty && objecty < state.battlefield.size[1]) {
							objectiveMemoized[memoKey][objectIndex].push([objectx, objecty]);
						}
					}
				}
			}
		});
	}

	if (terrain[terrainMemoKey] !== undefined && terrainMemoized[terrainMemoKey] === undefined) {
		terrainMemoized[terrainMemoKey] = [];

		const currentTerrain = new terrain[terrainMemoKey]();
		currentTerrain.getRectangleFootpintsAsTriangles().forEach((triangles) => {
			triangles.forEach(([A,B,C]) => {
				terrainMemoized[terrainMemoKey].push(...(new Triangle(...A, ...B, ...C)).getAllPoints());
			});
		});
	}

	const input = emptyInput();

	objectiveMemoized[memoKey].forEach((coords, i) => {
		input[Channel2Name[`ObjectiveMarker${i+1}`]] = coords;
	});
	input[ChannelTerrainName.Footprint] = terrainMemoized[terrainMemoKey];

	state.players.forEach((player, playerId) => {
		const totalPlayerModelNumber = player.models.length;
		player.models.forEach((gameModelId, playerModelId) => {
			const xy = state.models[gameModelId];
			if (xy === null) { return; }

			let entities = [];

			if (playerId === state.player) {
				let order = 0;
				if (playerModelId >= playerState.selected) {
					order = Math.min(playerModelId - playerState.selected, maxModelsAtOrder - 1);
				} else {
					order = Math.min(totalPlayerModelNumber - playerState.selected + playerModelId, maxModelsAtOrder - 1);
				}

				const stamina = Math.min(state.modelsStamina[gameModelId], maxModels);

				entities.push(Channel0Name[`PlayerModel${playerModelId}`]);
				entities.push(Channel3Name[`Order${order}`]);
				entities.push(Channel1Name[`Stamina${stamina}`]);
			} else {
				entities.push(Channel4Name[`OpponentModel${playerModelId}`]);
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

import { Phase } from './warhammer.js';
import { len } from '../utils/vec2.js';
import { deployment } from  '../battlefield/deployment.js';
import { terrain } from  '../battlefield/terrain.js';
import { Triangle } from '../utils/planimatrics/triangle.js';

//{ Empty: 0 }
const maxModels = 6;
export const Channel0 = {};
new Array(maxModels).fill(0).forEach((_, v) => { Channel0[`PlayerModel${v}`] = 1 });
export const Channel1 = {};

const maxStaminaValue = 10
Array(maxStaminaValue).fill(0).forEach(v => { Channel1[`Stamina${v}`] = v / maxStaminaValue; });

export const Channel2 = {};
[1,2,3,4,5].forEach(v => { Channel2[`ObjectiveMarker${v}`] = v/5 })
export const Channel3 = {};

const maxModelsAtOrder = 3;
new Array(maxModelsAtOrder).fill(0).forEach((_, v) => { Channel3[`Order${v}`] = (v + 1) / maxModelsAtOrder; });

export const Channel4 = {};
new Array(17).fill(0).forEach((_, v) => { Channel4[`OpponentModel${v}`] = 1 });

export const ChannelShootPriority = {};
new Array(17).fill(0).forEach((_, v) => { ChannelShootPriority[`ChannelShootPriority${v}`] = (v + 1) / maxModelsAtOrder;  });

export const ChannelTerrain = { Footprint: 1 };

export const Channel0Name = {}, Channel1Name = {}, Channel2Name = {}, Channel3Name = {}, Channel4Name = {}, ChannelShootPriorityName = {}, ChannelTerrainName = {};

Object.keys(Channel0).forEach(name => Channel0Name[name] = name);
Object.keys(Channel1).forEach(name => Channel1Name[name] = name);
Object.keys(Channel2).forEach(name => Channel2Name[name] = name);
Object.keys(Channel3).forEach(name => Channel3Name[name] = name);
Object.keys(Channel4).forEach(name => Channel4Name[name] = name);
Object.keys(ChannelShootPriority).forEach(name => ChannelShootPriorityName[name] = name);
Object.keys(ChannelTerrain).forEach(name => ChannelTerrainName[name] = name);


export const channels = [Channel0, Channel1, Channel2, Channel3, Channel4, ChannelShootPriority, ChannelTerrain];
export function emptyInput() {
	const input = {};
	[
		...Object.keys(Channel0Name),
		...Object.keys(Channel1Name),
		...Object.keys(Channel2Name),
		...Object.keys(Channel3Name),
		...Object.keys(Channel4Name),
		...Object.keys(ChannelShootPriorityName),
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
		const alivePlayerModelIds = [];
		player.models.forEach((gameModelId, playerModelId) => {
			if (state.models[gameModelId] !== null) {
				alivePlayerModelIds.push(playerModelId);
			}
		});
		const indexOfSelected = alivePlayerModelIds.indexOf(playerState.selected)

		player.models.forEach((gameModelId, playerModelId) => {
			const xy = state.models[gameModelId];
			if (xy === null) { return; }
			const alivePlayerModelIdIndex = alivePlayerModelIds.indexOf(playerModelId);
			let entities = [];

			if (playerId === state.player) {
				if (alivePlayerModelIdIndex >= indexOfSelected && (alivePlayerModelIdIndex - indexOfSelected <= maxModels)) {
					input[Channel0Name[`PlayerModel${alivePlayerModelIdIndex - indexOfSelected}`]] = [xy];
				} else if (alivePlayerModelIdIndex < indexOfSelected && alivePlayerModelIds.length - indexOfSelected + alivePlayerModelIdIndex <= maxModels) {
					input[Channel0Name[`PlayerModel${alivePlayerModelIds.length - indexOfSelected + alivePlayerModelIdIndex}`]] = [xy];
				}
				let order = 0;
				if (alivePlayerModelIdIndex >= indexOfSelected) {
					order = Math.min(alivePlayerModelIdIndex - indexOfSelected, maxModelsAtOrder - 1);
				} else {
					order = Math.min(alivePlayerModelIds.length - indexOfSelected + alivePlayerModelIdIndex, maxModelsAtOrder - 1);
				}

				entities.push(Channel3Name[`Order${order}`]);
				if (state.phase == Phase.Movement) {
					const stamina = Math.min(state.modelsStamina[gameModelId], maxStaminaValue);
					entities.push(Channel1Name[`Stamina${stamina}`]);
				}
			} else {
				input[Channel4Name[`OpponentModel${playerModelId}`]] = [xy];
			}

			entities.forEach(entity => {
				if (input[entity] === undefined) {
					input[entity] = [];
				}
				input[entity].push(xy);
			});
		});
		if (playerId !== state.player) {
			player.units.forEach(unit => {
				unit.models.forEach(gameModelId => {
					const xy = state.models[gameModelId];
					input[ChannelShootPriorityName[`ChannelShootPriority${unit.id}`]] = [xy];
				});
			});
		}
	});

	input.round = state.round;
	return input;
}
import { Phase } from './warhammer.js';

//{ Empty: 0 }
export const Channel0 = { 0: 1 }
export const Channel1 = { Stamina: 1 }

export const Channel0Name = {}, Channel1Name = {};

Object.keys(Channel0).forEach(name => Channel0Name[name] = name);
Object.keys(Channel1).forEach(name => Channel1Name[name] = name);

export const channels = [Channel0, Channel1];
export function emptyInput() {
	const input = {};
	[...Object.keys(Channel0Name), ...Object.keys(Channel1Name)].forEach(name => {
		input[name] = [];
	});
	return input;
}

export function getInput(state) {
	const input = emptyInput();

	state.players.forEach((player, playerId) => {
		player.models.forEach((gameModelId, playerModelId) => {
			const xy = state.models[gameModelId]
			if (xy === null) { return; }

			let entity = null;

			if (playerId === state.player) {
				input[playerModelId] = [xy];
				if (state.phase === Phase.Movement && state.modelsStamina[gameModelId] > 0) {
					entity = Channel1Name.Stamina;
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
import { BaseAction } from '../../environment/warhammer.js';

export const SelectAction = {
	DoNothing: 'DO_NOTHING',
	Select: 'SELECT',
}

export class SelectAgent {
	playStep(state, playerState) {
		const playerModels = state.players[state.player].models;

		const id = playerModels.findIndex(modelId => state.modelsStamina[modelId] > 0)

		if (id === playerState.selected) {
			return { order: { action: SelectAction.DoNothing } };
		}
		if (id >= 0) {
			return { order: { action: SelectAction.Select, id } };
		}
		return { order: { action: BaseAction.NextPhase } };
	}
}

import { getInput } from '../environment/nn-input.js';
import { BaseAction } from '../environment/warhammer.js';

export class DumbAgent {
	playStep(state) {
		return { order: { action: BaseAction.NextPhase }, orderIndex: 0, estimate: 0 };
	}
	getInput(state) {
		return getInput(state)
	}
	load() {}
}

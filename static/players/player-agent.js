import { Action } from '../environment/orders.js';
import { MoveAgent } from '../agents/move-agent/move-agent44x30.js';

export class PlayerAgent {
	static cascad = [MoveAgent.settings]
	_selectedModel = null;
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
		this._selectedModel = 0;
		this.agent = new MoveAgent();
	}
	async load() {
		await this.agent.load();
	}
	reset() {
		this.checkSize();
		this.lastRound = -1;
		this._selectedModel = 0;
	}
	playStep() {
		const prevState = this.env.getState();

		const { orderIndex, order, estimate } = this.agent.playStep(prevState, this.getState());

		let [order_, state] = this.step(order);

		return [order_, state, { index: orderIndex, estimate: estimate.toFixed(3) }];

	}
	step(order) {
		let playerOrder;
		const { action } = order;
		const prevState = this.env.getState();

		const playerModels = prevState.players[this.playerId].models;
		const round = prevState.round;

		if (this.lastRound !== round) {
			this.env.step({ action: Action.Move, vector: [0, 0], expense: 0, id: playerModels[this._selectedModel] });
			this.lastRound = round;
		}

		if (action === Action.Move) {
			playerOrder = {action, id: playerModels[this._selectedModel], vector: order.vector, expense: order.expense };
		} else if (action === Action.NextPhase && playerModels.some((modelId, playerModelId) => prevState.modelsStamina[modelId] !== 0 && playerModelId !== this._selectedModel)){
			this._selectedModel = this.selectNextModel(prevState);
			playerOrder = { action: Action.Move, vector: [0, 0], expense: 0, id: playerModels[this._selectedModel] };
		} else {
			playerOrder = order;
		}

		if (playerOrder.action === Action.NextPhase) {
			this._selectedModel = this.selectNextModel(prevState);
		}

		const state = this.env.step(playerOrder);

		return [{ ...playerOrder, misc: state.misc }, state];
	}

	checkSize() {
		if (this.agent.onlineNetwork === undefined) {
			return;
		}
		const [_, height, width] = this.agent.onlineNetwork.inputs[0].shape;
		const [fieldHeight, fieldWidth] = this.env.battlefield.size;
		if (fieldHeight !== height || fieldWidth !== width) {
			console.warn(`!!!!Map size and Network input are inconsistent: ${[fieldHeight, fieldWidth]} !== ${[height, width]}!!!`)
		}
	}
	selectNextModel(state) {
		const playerModels = state.players[this.playerId].models;
		const twicePlayerModels = [...playerModels, ...playerModels];
		let newSelectedModel = this._selectedModel;
		for (let i = newSelectedModel + 1; i < twicePlayerModels.length; i++) {
			let modelId = twicePlayerModels[i];
			if (!isNaN(state.models[modelId][0])) {
				newSelectedModel = i % playerModels.length;
				break;
			}
		}
		return newSelectedModel;
	}

	getState() {
		return { selected: this._selectedModel };
	}
}

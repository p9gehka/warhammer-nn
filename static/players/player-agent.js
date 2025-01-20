import { BaseAction } from '../environment/warhammer.js';
import { MoveAgent } from '../agents/move-agent/move-agent44x30.js';
import { SelectAgent, SelectAction } from '../agents/select-agent/select-agent.js';

export class PlayerAgent {
	static cascad = [MoveAgent.settings]
	_selectedModel = null;
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
		this._selectedModel = 0;
		this.agent = new MoveAgent();
		this.selectAgent = new SelectAgent();
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
		this.selectStep(this.selectAgent.playStep(prevState, { selected: this._selectedModel }));
		const { orderIndex, order, estimate } = this.agent.playStep(prevState, this.getState());

		let [order_, state] = this.step(order);

		return [order_, state, { index: orderIndex, estimate: estimate.toFixed(3) }];

	}
	selectStep(order) {
		if (order.action === SelectAction.Select) {
			this._selectedModel = order.id;

			const prevState = this.env.getState();
			const playerModels = prevState.players[this.playerId].models;
			this.env.step({ action: BaseAction.Move, vector: [0, 0], expense: 0, id: playerModels[order.id] });
		}
	}
	step(order) {
		let playerOrder;
		const { action } = order;
		const prevState = this.env.getState();

		const playerModels = prevState.players[this.playerId].models;
		const round = prevState.round;

		if (this.lastRound !== round) {
			this.env.step({ action: BaseAction.Move, vector: [0, 0], expense: 0, id: playerModels[this._selectedModel] });
			this.lastRound = round;
		}

		if (action === BaseAction.Move) {
			playerOrder = {action, id: playerModels[this._selectedModel], vector: order.vector, expense: order.expense };
		} else if (action === BaseAction.NextPhase && playerModels.some((modelId, playerModelId) => prevState.modelsStamina[modelId] !== 0 && playerModelId !== this._selectedModel)) {
			playerOrder ={ action: BaseAction.EndMove, id: playerModels[this._selectedModel] };
		} else {
			playerOrder = order;
		}

		const state = this.env.step(playerOrder);

		return [{ ...playerOrder, misc: state.misc }, state];
	}

	checkSize() {
		if (this.agent.onlineNetwork === undefined) {
			return;
		}
		const [_, width, height] = this.agent.onlineNetwork.inputs[0].shape;
		const [fieldHeight, fieldWidth] = this.env.battlefield.size;
		if (fieldHeight !== height || fieldWidth !== width) {
			console.warn(`!!!!Map size and Network input are inconsistent: ${[fieldHeight, fieldWidth]} !== ${[height, width]}!!!`)
		}
	}

	getState() {
		return { selected: this._selectedModel };
	}
}
import { BaseAction } from '../environment/warhammer.js';
import { PlayerAction } from './player-orders.js';
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
		const availableState = this.getAvailableStates();

		if (availableState.length === 0) {
			let [order_, state] = this.step({ action: BaseAction.NextPhase });
			return [order_, state, { index: 0, estimate: 0 }];
		}

		const results = this.agent.playStep(prevState, availableState);
		let maxResultIndex = 0;

		availableState.forEach((result, index) => {
			if (result.estimate > results[maxResultIndex].estimate) {
				maxResultIndex = index;
			}
		});

		this.setState(availableState[maxResultIndex]);

		const { orderIndex, order, estimate } = results[maxResultIndex];

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
			this.env.step({ action: BaseAction.Move, vector: [0, 0], expense: 0, id: playerModels[this._selectedModel] });
			this.lastRound = round;
		}

		if (action === BaseAction.Move) {
			playerOrder = {action, id: playerModels[this._selectedModel], vector: order.vector, expense: order.expense };
		} else if (action === BaseAction.EndMove){
			playerOrder = { action: BaseAction.EndMove, id: playerModels[this._selectedModel] };
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
	getAvailableStates() {
		const prevState = this.env.getState();
		const playerModels = prevState.players[this.playerId].models;
		let availableStates = [];
		playerModels.forEach((modelId, playerModelId) => {
			if (prevState.modelsStamina[modelId] > 0) {
				availableStates.push({ selected: playerModelId })
			}
		})

		return availableStates;
	}
	getState() {
		return { selected: this._selectedModel };
	}

	setState({ selected }) {
		this._selectedModel = selected;
	}
}

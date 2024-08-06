import { Action } from '../environment/orders.js';
import { MoveAgent } from '../agents/move-agent/move-agent60x44.js';
import { Phase } from '../environment/warhammer.js';

export class PlayerAgent {
	static cascad = [MoveAgent.settings]
	_selectedModel = null;
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
		this._selectedModel = this.env.players[this.playerId].models[0];
		this.agent = new MoveAgent();
	}
	async load() {
		await this.agent.load();
	}
	reset() {
		this.checkSize();
		this._selectedModel = this.env.players[this.playerId].models[0];
	}
	playStep() {
		const prevState = this.env.getState();
		let orderIndex, order, estimate;
		if (prevState.phase === Phase.Movement) {
			const result = this.agent.playStep(prevState, this.getState());
			orderIndex = result.orderIndex;
			order = result.order;
			estimate = result.estimate;
		} else {
			orderIndex = 0;
			order = { action: Action.NextPhase };
			estimate = 0;
		}

		let [order_, state] = this.step(order);
		return [order_, state, { index: orderIndex, estimate: estimate.toFixed(3) }];
	}
	step(order) {
		let playerOrder;
		const { action } = order;
		const prevState = this.env.getState();

		if (action === Action.Move) {
			playerOrder = {action, id: this._selectedModel, vector: order.vector, expense: order.expense };
		} else {
			playerOrder = order;
		}
		const state = this.env.step(playerOrder);

		return [{ ...playerOrder, misc: state.misc }, state];
	}
	getState() {
		return { selected: this._selectedModel };
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
}

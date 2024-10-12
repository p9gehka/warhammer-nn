import { BaseAction } from '../environment/warhammer.js';
import { MoveAgent } from '../agents/move-agent/move-agent44x30.js';
import { ShootAgent } from '../agents/shoot-agent/shoot-agent44x30.js';
import { DumbAgent } from '../agents/dumb-agent.js';
import { Phase } from '../environment/warhammer.js';

export class PlayerAgent {
	static cascad = [MoveAgent.settings]
	_selectedModel = null;
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
		this._selectedModel = 0;
		this.agents = {
			[Phase.Movement]: new MoveAgent(),
			[Phase.Shooting]: new DumbAgent(),
		};
	}
	async load() {
		await this.agents[Phase.Movement].load();
		await this.agents[Phase.Shooting].load();
	}
	reset() {
		this.checkSize();
		this.lastRound = -1;
		this._selectedModel = 0;
	}
	playStep() {
		const prevState = this.env.getState();
		let order, orderIndex, estimate;
		if (prevState.phase in this.agents) {
			const result = this.agents[prevState.phase].playStep(prevState, this.getState());
			orderIndex = result.orderIndex;
			order = result.order;
			estimate = result.estimate;
		} else {
			order = { action: BaseAction.NextPhase };
			orderIndex = 0;
			estimate = 0;
		}

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
		} else if (action === BaseAction.NextPhase && playerModels.some((modelId, playerModelId) => prevState.modelsStamina[modelId] !== 0 && playerModelId !== this._selectedModel)){
			this._selectedModel = this.selectNextModel(prevState);
			playerOrder = { action: BaseAction.Move, vector: [0, 0], expense: 0, id: playerModels[this._selectedModel] };
		} else {
			playerOrder = order;
		}

		if (playerOrder.action === BaseAction.NextPhase) {
			this._selectedModel = this.selectNextModel(prevState);
		}

		const state = this.env.step(playerOrder);

		return [{ ...playerOrder, misc: state.misc }, state];
	}

	checkSize() {
		[this.agents[Phase.Movement], this.agents[Phase.Shooting]].forEach(agent => {
			if (agent.onlineNetwork === undefined) {
				return;
			}
			const [_, width, height] = agent.onlineNetwork.inputs[0].shape;
			const [fieldHeight, fieldWidth] = this.env.battlefield.size;
			if (fieldHeight !== height || fieldWidth !== width) {
				console.warn(`!!!!Map size and Network input are inconsistent: ${[fieldHeight, fieldWidth]} !== ${[height, width]}!!!`)
			}
		});
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

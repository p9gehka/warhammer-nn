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
		this.opponentId = (playerId+1) % 2;
		this._selectedModel = 0;
		this.agents = {
			[Phase.Movement]: new MoveAgent(),
			[Phase.Shooting]: new DumbAgent(),
		};
		this.steps = {
			[Phase.Movement]: (order) => this.moveStep(order),
			[Phase.Shooting]: (order) => this.shootStep(order),
		}
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

		let [order_, state] = prevState.phase in this.steps ? this.steps[prevState.phase](order) : this.defaultStep(order);
		return [order_, state, { index: orderIndex, estimate: estimate.toFixed(3) }];
	}

	defaultStep(order) {
		const state = this.env.step(order);

		return [{ ...order, misc: state.misc }, state];
	}

	moveStep(order) {
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
	shootStep() {
		const playerOrder = { action: BaseAction.NextPhase };
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
		let id = 0;
		if (state.phase === phase.Move) {
			id = playerModels.findIndex((modelId, playerModelId) => playerModelId > this._selectedModel && state.modelsStamina[modelId] > 0);
		} else {
			id = playerModels.findIndex((modelId, playerModelId) => playerModelId > this._selectedModel && state.availableToShoot.includes(modelId))
		}

		return id >= 0 ? id : 0;
	}

	getState() {
		return { selected: this._selectedModel, visibleOpponentUnits: [] };
	}
}

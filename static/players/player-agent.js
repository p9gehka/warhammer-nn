import { BaseAction } from '../environment/warhammer.js';
import { MoveAgent } from '../agents/move-agent/move-agent60x44.js';
import { ShootAgent } from '../agents/shoot-agent/shoot-agent60x44.js';
import { Phase } from '../environment/warhammer.js';
import { shotDice } from './dice.js';

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
			[Phase.Shooting]: new ShootAgent(),
		}
		this.agent = new MoveAgent();
	}
	async load() {
		await this.agent.load();
	}
	reset() {
		this.checkSize();
		this.lastRound = -1
		this._selectedModel = 0;
	}
	async playStep() {
		const prevState = this.env.getState();
		let orderIndex, order, estimate;
		if (prevState.phase in this.agents) {
			const result = this.agents[prevState.phase].playStep(prevState, this.getState());
			orderIndex = result.orderIndex;
			order = result.order;
			estimate = result.estimate;
		} else {
			orderIndex = 0;
			order = { action: BaseAction.NextPhase };
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
		} else if (action === BaseAction.Shoot) {
			const shooter = playerModels[this._selectedModel];
			const weaponId = this.env.models[shooter].rangedWeaponLoaded.findIndex(loaded => loaded);
			playerOrder = {
				action,
				id: shooter,
				target: order.target,
				weaponId,
				...shotDice(this.env.models[shooter].rangedWeapons[weaponId]),
			};

		} else if (action === BaseAction.NextPhase && playerModels.some((modelId, playerModelId) => prevState.modelsStamina[modelId] !== 0 && playerModelId !== this._selectedModel)) {
			this._selectedModel = this.selectNextModel(prevState);
			playerOrder = { action: BaseAction.Move, vector: [0, 0], expense: 0, id: playerModels[this._selectedModel] };
		} else if (action === BaseAction.NextPhase && playerModels.some((modelId, playerModelId) => prevState.availableToShoot.includes(modelId) && playerModelId !== this._selectedModel)) {
			this._selectedModel = this.selectNextModel(prevState);
			playerOrder = { action: BaseAction.Shoot, id: playerModels[this._selectedModel], target: -1 };
		} else {
			playerOrder = order;
		}

		if (playerOrder.action === BaseAction.NextPhase) {
			this._selectedModel = this.selectNextModel(prevState);
		}

		const state = this.env.step(playerOrder);

		return [{ ...playerOrder, misc: state.misc }, state];
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
		const state = this.env.getState();
		const playerModels = state.players[this.playerId].models;
		const visibleOpponentUnits = [];
		state.players[this.opponentId].units.forEach(unit => {
			if (this.env.getAvailableTarget(playerModels[this._selectedModel], 0, unit.id).length > 0) {
				visibleOpponentUnits.push(unit.id);
			}
		})
		return { selected: this._selectedModel, visibleOpponentUnits: visibleOpponentUnits };
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

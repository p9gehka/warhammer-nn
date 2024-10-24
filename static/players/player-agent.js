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
			[Phase.Shooting]: new ShootAgent(),
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

		const playerModels = prevState.players[this.playerId].models;
		if (!this.isSelectedOnField()) {
			this._selectedModel = this.selectNextModel(prevState);
		}

		if (prevState.phase in this.agents && this.isSelectedOnField()) {
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
	isSelectedOnField() {
		const state = this.env.getState();
		const playerModels = state.players[this.playerId].models;
		return !isNaN(state.models[playerModels[this._selectedModel]][0]);
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

		if (isNaN(prevState.models[playerModels[this._selectedModel]][0])) {
			this._selectedModel = this.selectNextModel(prevState);
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

	shootStep(order) {
		let playerOrder;
		const { action } = order;
		const prevState = this.env.getState();

		const playerModels = prevState.players[this.playerId].models;

		if (action === BaseAction.Shoot) {
			const shooter = playerModels[this._selectedModel];
			const weaponId = 0;
			const shotDiceResult = new Array(this.env.models[shooter].getRangedWeapon(weaponId).a.constant * 2).fill(6)
			playerOrder = {
				action,
				id: shooter,
				target: prevState.players[this.opponentId].units[order.target].gameId,
				weaponId,
				shotDiceResult
			};
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
		const state = this.env.getState();
		const playerModels = state.players[this.playerId].models;
		const visibleOpponentUnits = [];
		let maxRangeWeaponId = 0;
		let maxRange = 0;

		const selectedEnvModel = this.env.models[playerModels[this._selectedModel]];
		selectedEnvModel?.rangedWeaponLoaded.forEach((loaded, id) => {
			const weapon = selectedEnvModel.getRangedWeapon(id);
			if(loaded && weapon?.range > maxRange) {
				maxRangeWeaponId = id;
				maxRange = weapon.range;
			}
		});

		state.players[this.opponentId].units.forEach(unit => {
			if (this.env.getAvailableTarget(playerModels[this._selectedModel], maxRangeWeaponId, unit.gameId).length > 0) {
				visibleOpponentUnits.push(unit.id);
			}
		});

		return { selected: this._selectedModel, visibleOpponentUnits: visibleOpponentUnits };
	}
}

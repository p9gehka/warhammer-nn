import { BaseAction } from '../environment/warhammer.js';
import { MoveAgent as MoveToFreeObject } from '../agents/move-agent/move-to-free-object-agent.js';
import { ShootAgent } from '../agents/shoot-agent/shoot-agent44x30.js';
import { DumbAgent } from '../agents/dumb-agent.js';
import { PlayerAgent } from './player-agent.js';
import { Phase } from '../environment/warhammer.js';

let agents = { moveToObject: DumbAgent, moveToFreeObject: MoveToFreeObject };

export class PlayerTower extends PlayerAgent {
	constructor(...args) {
		super(...args);
		this.agents = {
			[Phase.Movement]: new DumbAgent(),
			[Phase.Shooting]: new ShootAgent()
		}
	}
	setAgent(agent) {
		this.agents[Phase.Movement] = new agents[agent];
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

import { Action, Phase } from './warhammer.js';
import { round } from '../static/utils/vec2.js';

export const Entities = {
	Empty: 0,
	Marker: 1,
	SelfStrikeTeam: 2,
	SelfStrikeTeamAvailableToMove: 3,
	SelfStrikeTeamAvailableToShoot: 4,
	SelfStealth: 5,
	SelfStealthAvailableToMove: 6,
	SelftStealthAvailableToShoot: 7,
	EnemyStrikeTeam: 8,
	EnemyStealth: 9
}

export class PlayerEnvironment {
	height = 44;
	width = 30;
	vp = 0
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
	}
	step(order) {
		let newOrder;

		if (order.action === Action.Move) {
			const { action, id, vector } = order;
			newOrder = {action, id: this.env.players[this.playerId].models[id], vector};
		} else if (order.action === Action.Shoot) {
			const { action, id, target } = order;
			newOrder = {
				action,
				id: this.env.players[this.playerId].models[id],
				target: this.env.players[this.enemyId].models[target]
			}
		} else {
			newOrder = order;
		}
		const state = this.env.step(newOrder);

		let doneReward = 0;
		const { players } = state;
		if (state.done) {
			if (players[this.playerId].models.every(modelId => state.models[modelId] === null)) {
				doneReward -= 20;
			}
			if (players[this.enemyId].models.every(modelId => state.models[modelId] === null)) {
				doneReward += 20;
			}
		}
		const newVP = players[this.playerId].vp;
		const vpDelta = newVP - players[this.enemyId].vp;
		const reward = newVP + vpDelta + doneReward - this.vp ;
		this.vp = newVP;

		return [newOrder, state, reward];
	}

	getInput() {
		const battlefield = this.env.battlefield;
		const input = { [Entities.Marker]: battlefield.objective_marker };
		const state = this.env.getState();
		for (let player of state.players) {
			for (let unit of player.units) {
				unit.models.forEach(modelId => {
					const xy = state.models[modelId]
					if (xy === null) { return; }
					let entity = null;

					if (unit.playerId === this.playerId) {
						if (unit.name === 'strike_team') {
							entity = Entities.SelfStrikeTeam;
							if(state.availableToMove.includes(modelId) && state.phase === Phase.Movement) {
								entity = Entities.SelfStrikeTeamAvailableToMove;
							}
							if(state.availableToShoot.includes(modelId) && state.phase === Phase.Shooting) {
								entity = Entities.SelfStrikeTeamAvailableToShoot;
							}
						}

						if (unit.name === 'stealth_battlesuits') {
							entity = Entities.SelfStealth;

							if(state.availableToMove.includes(modelId) && state.phase === Phase.Movement) {
								entity = Entities.SelfStealthAvailableToMove;
							}
							if(state.availableToShoot.includes(modelId) && state.phase === Phase.Shooting) {
								entity = Entities.SelfStealthmAvailableToShoot;
							}
						}
					}
					if (unit.playerId !== this.playerId) {
						if (unit.name === 'strike_team') {
							entity = Entities.EnemyStrikeTeam;
						}

						if (unit.name === 'stealth_battlesuits') {
							entity = Entities.EnemyStealth;
						}
					}
					if (entity !== null) {
						if (input[entity] === undefined) {
							input[entity] = [];
						}
						input[entity].push(round(xy))
					}
				});
			}
		}
		return input
	}
}

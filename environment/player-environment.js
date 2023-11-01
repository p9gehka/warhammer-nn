import { Action } from './warhammer.js';
import { round } from '../static/utils/vec2.js';

export const Entities = {
	Empty: 0,
	Marker: 1,
	SelfStrikeTeam: 2,
	SelfStrikeTeamMoved: 3,
	SelfStrikeTeamShooted: 4,
	SelfStealth: 5,
	SelfStealthMoved: 6,
	SelfStealthShooted: 7,
	EnemyStrikeTeam: 8,
	EnemyStealth: 9
}

export class PlayerEnvironment {
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
	}

	step(order) {
		if (order.action === Action.Move) {
			const { action, id, vector } = order;
			const newOrder = {action, id: this.env.players[this.playerId].models[id], vector};
			return [newOrder, this.env.step(newOrder)];
		}

		if (order.action === Action.Shoot) {
			const { action, id, target } = order;
			const newOrder = {
				action,
				id: this.env.players[this.playerId].models[id],
				target: this.env.players[(this.playerId+1) % 2].models[target]
			}
			const state = this.env.step(newOrder);
			return [{ ...newOrder, misc: state.misc ?? null}, state];
		}

		return [order, this.env.step(order)];
	}

	getInput44x30() {
		const state = this.env.getState();
		const playerId = this.playerId;
		const battlefield = this.env.battlefield;

		let input = []
		for (let i = 0; i < battlefield.size[1]; i++) {
			input[i] = Array(battlefield.size[0]).fill(Entities.Empty);
		}
		for (let [x, y] of battlefield.objective_marker) {
			input[y][x] = Entities.Marker;
		}

		for (let player of state.players) {
			for (let unit of player.units) {
				unit.models.forEach(modelId => {
					const model = state.models[modelId]
					if (model === null) {
						return;
					}
					const [x, y] = round(model);

					if (0 <= y && y < input.length && 0 <=x && x < input[y].length) {
						let entity = null;

						if (unit.playerId === playerId) {
							if (unit.name === 'strike_team') {
								if(state.availableToMove.includes(modelId)) {
									entity = Entities.SelfStrikeTeam;
								} else if(state.availableToShoot.includes(modelId)) {
									entity = Entities.SelfStrikeTeamMoved;
								} else {
									entity = Entities.SelfStrikeTeamShooted;
								}
							}

							if (unit.name === 'stealth_battlesuits') {
								if(state.availableToMove.includes(modelId)) {
									entity = Entities.SelfStealth;
								} else if(state.availableToShoot.includes(modelId)) {
									entity = Entities.SelfStealthMoved;
								} else {
									entity = Entities.SelfStealthShooted;
								}
							}
						}
						if (unit.playerId !== playerId) {
							if (unit.name === 'strike_team') {
								entity = Entities.EnemyStrikeTeam;
							}

							if (unit.name === 'stealth_battlesuits') {
								entity = Entities.EnemyStealth;
							}
						}
						if (entity !== null) {
							input[y][x] = entity;
						}
					}
				})
			}
		}

		return input;
	}
}

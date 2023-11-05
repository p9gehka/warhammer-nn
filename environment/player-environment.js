import { BaseAction, Phase } from './warhammer.js';
import { round } from '../static/utils/vec2.js';


export const Action = {
	...BaseAction,
	Select: "SELECT"
}


export const Channel1 = {
	Empty: 0,
	Marker: 1,
	SelfStrikeTeam: 2,
	SelfStrikeTeamAvailableToMove: 3,
	SelfStrikeTeamAvailableToShoot: 4,
	SelfStealth: 5,
	SelfStealthAvailableToMove: 6,
	SelfStealthAvailableToShoot: 7,
	EnemyStrikeTeam: 8,
	EnemyStealth: 9
}
export const Channel2 = { Empty: 0, Selected: 1 };
export const Channel1Name = {}, Channel2Name = {};

Object.keys(Channel1).forEach(name => Channel1Name[name] = name);
Object.keys(Channel2).forEach(name => Channel2Name[name] = name);

export const channels = [Channel1, Channel2];

export class PlayerEnvironment {
	height = 44;
	width = 30;
	channels = 2;
	vp = 0;
	_selectedModel = null;
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
		this.reset();
	}

	reset() {
		this.vp = 0;
		this._selectedModel = null;
	}

	step(order) {
		let newOrder;

		if (order.action === Action.Select) {
			const { action, id } = order;
			this._selectedModel = this.env.players[this.playerId].models[id];
			newOrder = { action, id: this._selectedModel };
		} else if (order.action === Action.Move) {
			const { action, vector } = order;
			newOrder = {action, id: this._selectedModel, vector };
		} else if (order.action === Action.Shoot) {
			const { action, target } = order;
			newOrder = {
				action,
				id: this._selectedModel,
				target: this.env.players[this.enemyId].models[target]
			}
		} else {
			newOrder = order;
		}
		let state;
		let reward = 0;

		if(newOrder.action === Action.Select || (this._selectedModel === null && (newOrder.action === Action.Move || newOrder.action === Action.Shoot ))) {
			state = this.env.getState();
		} else if (newOrder.action !== Action.Select) {
			state = this.env.step(newOrder);
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
			reward = newVP + vpDelta + doneReward - this.vp ;
			this.vp = newVP;

		} else {
			state = this.env.getState();
		}

		return [newOrder, { ...state, selectedModel: this._selectedModel }, reward];
	}
	selectedModel() {
		if (this.env.getState().models[this._selectedModel] === null) {
			this._selectedModel = null;
		}
		return this._selectedModel;
	}
	getInput() {
		const selectedModel = this.selectedModel();
		const battlefield = this.env.battlefield;
		const input = {};
		[...Object.keys(Channel1Name), ...Object.keys(Channel2Name)].forEach(name => {
			input[name] = [];
		})
		input[Channel1Name.Marker] = battlefield.objective_marker;
		const state = this.env.getState();

		if (selectedModel && state.models[selectedModel]) {
			input[Channel2Name.Selected] = [state.models[selectedModel]];
		}

		for (let player of state.players) {
			for (let unit of player.units) {
				unit.models.forEach(modelId => {
					const xy = state.models[modelId]
					if (xy === null) { return; }
					let entity = null;

					if (unit.playerId === this.playerId) {
						if (unit.name === 'strike_team') {
							entity = Channel1Name.SelfStrikeTeam;
							if(state.availableToMove.includes(modelId) && state.phase === Phase.Movement) {
								entity = Channel1Name.SelfStrikeTeamAvailableToMove;
							}
							if(state.availableToShoot.includes(modelId) && state.phase === Phase.Shooting) {
								entity = Channel1Name.SelfStrikeTeamAvailableToShoot;
							}
						}

						if (unit.name === 'stealth_battlesuits') {
							entity = Channel1Name.SelfStealth;

							if(state.availableToMove.includes(modelId) && state.phase === Phase.Movement) {
								entity = Channel1Name.SelfStealthAvailableToMove;
							}
							if(state.availableToShoot.includes(modelId) && state.phase === Phase.Shooting) {
								entity = Channel1Name.SelfStealthmAvailableToShoot;
							}
						}
					}
					if (unit.playerId !== this.playerId) {
						if (unit.name === 'strike_team') {
							entity = Channel1Name.EnemyStrikeTeam;
						}

						if (unit.name === 'stealth_battlesuits') {
							entity = Channel1Name.EnemyStealth;
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

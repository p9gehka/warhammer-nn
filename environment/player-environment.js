import { BaseAction, Phase } from './warhammer.js';
import { round } from '../static/utils/vec2.js';


export const Action = {
	...BaseAction,
	Select: "SELECT"
}

export const Channel1 = {
	Empty: 0,
	SelfModel: 1,
	SelfModelAvailableToMove: 2,
	SelfModelAvailableToShoot: 3,
};

export const Channel2 = {
	Empty: 0,
	Selected: 1,
	Marker: 2,
	Enemy: 3,
}
export const Channel3 = {
	Empty: 0,
	StrikeTeam: 1,
	Stealth: 2,
}

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
	cumulativeReward = 0;
	frameCount = 0;
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
		this.reset();
	}

	reset() {
		this.vp = 0;
		this.cumulativeReward = 0;
		this._selectedModel = null;
		this.frameCount = 0;
	}

	step(order) {
		let newOrder;
		this.frameCount++;
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
			let vpDelta = 0;
			const newVP = players[this.playerId].vp;
			if (order.action === Action.NextPhase) {
				vpDelta = newVP - players[this.enemyId].vp
			}
			reward = newVP + vpDelta + doneReward - this.vp ;
			this.vp = newVP;

		} else {
			state = this.env.getState();
		}
		this.cumulativeReward += reward;
		return [{ ...newOrder, misc: state.misc }, { ...state, selectedModel: this._selectedModel }, reward];
	}
	selectedModel() {
		if (this.env.getState().models[this._selectedModel] === null) {
			this._selectedModel = null;
		}
		return this._selectedModel;
	}
	getInput() {
		const selectedModel = this.selectedModel();
		const state = this.env.getState();
		const battlefield = this.env.battlefield;
		const input = {};
		[...Object.keys(Channel1Name), ...Object.keys(Channel2Name)].forEach(name => {
			input[name] = [];
		})
		input[Channel2Name.Marker] = round(battlefield.objective_marker);

		if (selectedModel !== null && state.models[selectedModel] !== null) {
			input[Channel2Name.Selected] = [round(state.models[selectedModel])];
		}

		for (let player of state.players) {
			for (let unit of player.units) {
				unit.models.forEach(modelId => {
					const xy = state.models[modelId]
					if (xy === null) { return; }

					let entity = null;

					if (unit.playerId === this.playerId) {
						entity = Channel1Name.SelfModel;
						if(state.availableToMove.includes(modelId) && state.phase === Phase.Movement) {
							entity = Channel1Name.SelfModelAvailableToMove;
						}

						if(state.availableToShoot.includes(modelId) && state.phase === Phase.Shooting) {
							entity = Channel1Name.SelfModelAvailableToShoot;
						}
					}

					if (unit.playerId !== this.playerId) {
						entity = Channel2Name.Enemy;
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
		return input;
	}
}

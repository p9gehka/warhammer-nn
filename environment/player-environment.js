import { BaseAction, Phase } from './warhammer.js';
import { round, round2 } from '../static/utils/vec2.js';
import { getStateTensor } from '../agents/utils.js';

export const Action = {
	...BaseAction,
	Select: "SELECT"
}

export const Channel1 = {
	Empty: 0,
	SelfModel: 0.33,
	SelfModelAvailableToMove: 0.66,
	SelfModelAvailableToShoot: 1,
};

export const Channel2 = {
	Empty: 0,
	Marker: 0.5,
	Ruin: 1,
}

export const Channel3 = {
	Empty: 0,
	Selected: 0.5,
	Enemy: 1,
}

export const Channel4 = {
	Empty: 0,
	StrikeTeam: 1,
	Stealth: 2,
}

const MAX_REWARD =  250;
export const Channel1Name = {}, Channel2Name = {}, Channel3Name = {};

Object.keys(Channel1).forEach(name => Channel1Name[name] = name);
Object.keys(Channel2).forEach(name => Channel2Name[name] = name);
Object.keys(Channel3).forEach(name => Channel3Name[name] = name);

export const channels = [Channel1, Channel2];

export class PlayerEnvironment {
	height = 44;
	width = 30;
	channels = 3;
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

			if ((state.done && players[this.enemyId].models.every(modelId => state.models[modelId] === null))) {
				doneReward += MAX_REWARD;
			}

			let vpDelta = 0;
			const newVP = players[this.playerId].vp;
			if (order.action === Action.NextPhase) {
				vpDelta = newVP - players[this.enemyId].vp;
			}
			reward =  Math.max(newVP + vpDelta + doneReward - this.vp, 0) + 1;

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
		[...Object.keys(Channel1Name), ...Object.keys(Channel2Name), ...Object.keys(Channel3Name)].forEach(name => {
			input[name] = [];
		})

		input[Channel2Name.Marker] = battlefield.objective_marker.map(round);
		input[Channel2Name.Ruin] = battlefield.ruins.map(([[x1, y1], [x2, y2]]) => {
			return Array.from({ length:Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2))})
			.fill((x, y) => [[x + Math.sign(x2 - x), y + Math.sign(y2 - y)]])
			.reduce((list, cb) => list.concat(cb(...list.at(-1))), [[x1, y1]])	
		}).flat()

		if (selectedModel !== null && state.models[selectedModel] !== null) {
			input[Channel3Name.Selected] = [round(state.models[selectedModel])];
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
						entity = Channel3Name.Enemy;
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

	printStateTensor() {
		const input = this.getInput();
		const stateTensor = getStateTensor([input], this.height, this.width, this.channels);

		console.log('************************')
		for (const line of stateTensor.arraySync()[0]) {
			console.log(JSON.stringify(line.map((ch) => {
				const [ch1, ch2, ch3] = round2(ch);
				if (ch3 !== 0) {
					return {
						[Channel3.Selected]: 'I',
						[Channel3.Enemy]: 'E',
					}
				} else if(ch2 !== 0) {
					return {
						[Channel2.Marker]: '*',
						[Channel2.Ruin]: '#'
					}[ch2]
				} else  if(ch1 !== 0) {
					return {
						[Channel1.SelfModel]: 'i',
						[Channel1.SelfModelAvailableToMove]: 'M',
						[Channel1.SelfModelAvailableToShoot]: 'S'
					}[ch1]
				}else {
					return '.';
				}
			})));
		}
	}
	win() {
		const player = this.env.players[this.playerId];
		this.env.done() && player.vp > this.env.players[this.enemyId].vp && player.models.some(modelId => !this.env.models[modelId].dead)
	}
}


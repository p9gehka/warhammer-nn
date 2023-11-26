import { BaseAction, Phase } from './warhammer.js';
import { round, round2 } from '../static/utils/vec2.js';
import { getStateTensor, Orders } from '../agents/utils.js';


export const Action = {
	...BaseAction,
	Select: "SELECT"
}

export const Channel0 = {
	Empty: 0,
	0: 0.5,
	1: 1,
}

export const Channel1 = {
	Empty: 0,
	SelfModelAvailableToMove: 0.25,
	SelfModelNotAvailableToMove: 0.5,
	SelfModelAvailableToShoot: 0.75,
	SelfModelNotAvailableToShoot: 1,
};

export const Channel2 = {
	Empty: 0,
	Selected: 0.25,
	Marker: 0.5,
	Enemy: 0.75,
	Ruin: 1,
}

export const Channel4 = {
	Empty: 0,
	StrikeTeam: 1,
	Stealth: 2,
}

export const Channel0Name = {},  Channel1Name = {}, Channel2Name = {};

Object.keys(Channel0).forEach(name => Channel0Name[name] = name);
Object.keys(Channel1).forEach(name => Channel1Name[name] = name);
Object.keys(Channel2).forEach(name => Channel2Name[name] = name);


export function emptyInput() {
	const input = {};
	[...Object.keys(Channel0Name), ...Object.keys(Channel1Name), ...Object.keys(Channel2Name)].forEach(name => {
		input[name] = [];
	});
	return input;
}

export class PlayerEnvironment {
	height = 44;
	width = 30;
	channels = [Channel0, Channel1, Channel2];
	vp = 0;
	_selectedModel = null;
	cumulativeReward = 0;
	frameCount = 0;
	prevOrderAction = 0;
	phaseStepCounter = 0;
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
		this.reset();
		this.orders = (new Orders(env.players[playerId].models.length, env.players[this.enemyId].models.length)).getOrders()
	}

	reset() {
		this.vp = 0;
		this.cumulativeReward = 0;
		this.phaseStepCounter = 0;
		this._selectedModel = null;
	}

	step(order) {
		this.phaseStepCounter++;
		this.frameCount++;
		let playerOrder;
		const { action } = order;
		if (action === Action.Select) {
			this._selectedModel = this.env.players[this.playerId].models[order.id];
			playerOrder = { action, id: this._selectedModel };
		} else if (action === Action.Move) {
			playerOrder = {action, id: this._selectedModel, vector: order.vector };
		} else if (order.action === Action.Shoot) {
			playerOrder = {
				action,
				id: this._selectedModel,
				target: this.env.players[this.enemyId].models[order.target]
			}
		} else {
			playerOrder = order;
		}
		let state;
		let reward = 0;
		if (this.phaseStepCounter > 15) {
			this.env.end();
		}

		if(action === Action.Select || (this._selectedModel === null && (action === Action.Move || action === Action.Shoot))) {
			state = this.env.getState();
		} else if (action !== Action.Select) {
			state = this.env.step(playerOrder);

			const { vp } = state.players[this.playerId];
			reward = vp - this.vp;
			this.vp = vp;
		} else {
			state = this.env.getState();
		}
		if ((action === this.prevOrderAction && action !== Action.NextPhase) || (action === Action.Shoot && state.misc.hits === undefined) ) {
			reward--;
		}

		if (playerOrder === Action.NextPhase) {
			this.phaseStepCounter = 0;
		}

		this.cumulativeReward += reward;
		this.prevOrderAction = action;
		return [{ ...playerOrder, misc: state.misc }, { ...state, selectedModel: this._selectedModel }, reward];
	}
	awarding() {
		const state = this.env.getState();
		const { players } = state;
		let reward = 0;
		const totalUnits = 2;
		if (this.win()) {
			reward += (5 - Math.round(state.turn / 2)) * (this.env.objectiveControlReward * totalUnits);
		}

		if (this.loose()) {
			reward -= 5 * this.env.objectiveControlReward * totalUnits;
		}

		this.cumulativeReward += reward;
		return reward;
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
		const input = emptyInput();

		input[Channel2Name.Marker] = battlefield.objective_marker.map(round);
		input[Channel2Name.Ruin] = battlefield.ruins.map(([[x1, y1], [x2, y2]]) => {
			return Array.from({ length:Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2))})
			.fill((x, y) => [[x + Math.sign(x2 - x), y + Math.sign(y2 - y)]])
			.reduce((list, cb) => list.concat(cb(...list.at(-1))), [[x1, y1]])	
		}).flat()

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
						if (state.phase === Phase.Movement) {
							entity = state.availableToMove.includes(modelId) ?
								Channel1Name.SelfModelAvailableToMove : Channel1Name.SelfModelNotAvailableToMove;
						}
						
						if (state.phase === Phase.Shooting) {
							entity = state.availableToShoot.includes(modelId) ?
								Channel1Name.SelfModelAvailableToShoot : Channel1Name.SelfModelNotAvailableToShoot;
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

		state.players[this.playerId].models.forEach((modelId, i) => {
			const modelPosition = state.models[modelId];
			if (modelPosition !== null) {
				input[i] = [modelPosition]
			}
		});

		return input;
	}

	printStateTensor() {
		const input = this.getInput();
		const stateTensor = getStateTensor([input], this.height, this.width, this.channels);

		console.log('************************')
		for (const line of stateTensor.arraySync()[0]) {
			console.log(line.map((ch) => {
				const [ch1, ch2] = round2(ch);
				if(ch2 !== 0) {
					return {
						[Channel2.Selected]: 'I',
						[Channel2.Marker]: '*',
						[Channel2.Enemy]: 'E',
						[Channel2.Ruin]: '#'
					}[ch2]
				} else  if(ch1 !== 0) {
					return {
						[Channel1.SelfModelNotAvailableToMove]: 'm',
						[Channel1.SelfModelAvailableToMove]: 'M',
						[Channel1.SelfModelNotAvailableToShoot]: 's',
						[Channel1.SelfModelAvailableToShoot]: 'S'
					}[ch1]
				}else {
					return '.';
				}
			}).join());
		}
	}
	loose() {
		const player = this.env.players[this.playerId];
		return player.models.every(modelId => this.env.models[modelId].dead);
	}
	win() {
		const enemy = this.env.players[this.enemyId];
		return enemy.models.every(modelId => this.env.models[modelId].dead);
	}
}


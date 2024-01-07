import { BaseAction, Phase } from './warhammer.js';
import { round, round2, eq } from '../static/utils/vec2.js';
import { getStateTensor, Orders } from '../agents/utils.js';


export const Action = {
	...BaseAction,
}

export const Channel1 = {
	Empty: 0,
	SelfModelAvailableToMove: 0.5,
	SelfModelNotAvailableToMove: 1,
};

export const Channel2 = {
	Empty: 0,
	Marker: 1,
}

export const Channel1Name = {}, Channel2Name = {};

Object.keys(Channel1).forEach(name => Channel1Name[name] = name);
Object.keys(Channel2).forEach(name => Channel2Name[name] = name);

export function emptyInput() {
	const input = {};
	[...Object.keys(Channel1Name), ...Object.keys(Channel2Name)].forEach(name => {
		input[name] = [];
	});
	return input;
}

export class PlayerEnvironment {
	height = 22;
	width = 15;
	channels = [Channel1, Channel2];
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
		this._selectedModel = this.env.players[this.playerId].models[0];
	}

	reset() {
		this.vp = 0;
		this.cumulativeReward = 0;
		this.phaseStepCounter = 0;
	}

	step(order) {
		this.phaseStepCounter++;
		this.frameCount++;
		let playerOrder;
		const { action } = order;
		const prevState = this.env.getState();

		if (action === Action.Move) {
			playerOrder = {action, id: this._selectedModel, vector: order.vector };
		} else {
			playerOrder = order;
		}
		let state;
		let reward = 0;
		if (this.phaseStepCounter > 15) {
			this.env.end();
		}

		state = this.env.step(playerOrder);
		const { vp } = state.players[this.playerId];
		reward = vp - this.vp;
		this.vp = vp;

		if (
			state.models[this._selectedModel] === null || (playerOrder.action === Action.Move && eq(prevState.models[this._selectedModel], state.models[this._selectedModel]))
		) {
			reward--;
		} else {
			reward++;
			if (playerOrder.action !== Action.NextPhase) {
				reward += 0.5;
			}
		}

		if (action === Action.NextPhase) {
			this.phaseStepCounter = 0;
		}

		this.cumulativeReward += reward;
		this.prevOrderAction = action;
		return [{ ...playerOrder, misc: state.misc }, state, reward];
	}
	awarding() {
		const state = this.env.getState();
		const { players } = state;
		let reward = 0;

		if (this.loose()) {
			reward -= 5 * this.env.objectiveControlReward * this.env.battlefield.objective_marker.length;
		}

		this.cumulativeReward += reward;
		return reward;
	}

	getInput() {
		const state = this.env.getState();
		const battlefield = this.env.battlefield;
		const input = emptyInput();

		input[Channel2Name.Marker] = battlefield.objective_marker.map(round);

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
			console.log(line.map((ch) => {
				const [ch1, ch2] = round2(ch);
				if(ch1 !== 0) {
					return {
						[Channel1.SelfModelNotAvailableToMove]: 'm',
						[Channel1.SelfModelAvailableToMove]: 'M',
					}[ch1]
				} else if (ch2 !== 0) {
					return { [Channel2.Marker]: '*' }[ch2s]
				} else {
					return '.';
				}
			}).join());
		}
	}
	loose() {
		const player = this.env.players[this.playerId];
		return player.models.every(modelId => this.env.models[modelId].dead);
	}
}


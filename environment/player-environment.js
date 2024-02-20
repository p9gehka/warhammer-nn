import { BaseAction, Phase } from './warhammer.js';
import { eq, len } from '../static/utils/vec2.js';
import { getStateTensor } from '../agents/utils.js';
import {  Orders } from './orders.js';

export const Action = {
	...BaseAction,
}

//{ Empty: 0 }
export const Channel0 = { 0: 1 }
export const Channel1 = { Stamina: 1 }
export const Channel2 = { ObjectiveMarker: 1 };

export const Channel0Name = {}, Channel1Name = {}, Channel2Name = {};

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
	height = 22;
	width = 15;
	channels = [Channel0, Channel1, Channel2];
	objectiveMarkerInput = [];
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

		this.objectiveMarkerInput = [];

		this.env.battlefield.objective_marker.forEach(([x, y]) => {
			const delta = this.env.battlefield.objective_marker_control_distance;
			for(let i = -delta; i <= delta; i++) {
				for(let ii = -delta; ii <= delta; ii++) {
					if (len([i, ii]) <= delta) {
						this.objectiveMarkerInput.push([x + i, y + ii]);
					}
				}
			}
		});
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
			if (playerOrder.action !== Action.NextPhase) {
				reward += 0.1;
			} else {
				reward -= 0.2;
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

		input[Channel2Name.ObjectiveMarker] = this.objectiveMarkerInput;

		state.players.forEach((player, playerId) => {
			player.models.forEach((gameModelId, playerModelId) => {
				const xy = state.models[gameModelId]
				if (xy === null) { return; }

				let entity = null;

				if (playerId === this.playerId) {
					input[playerModelId] = [xy];
					if (state.phase === Phase.Movement && state.availableToMove.includes(gameModelId)) {
						entity = Channel1Name.Stamina;
					}
				}

				if (entity !== null) {
					if (input[entity] === undefined) {
						input[entity] = [];
					}
					input[entity].push(xy)
				}
			});
		});
		return input;
	}

	printStateTensor() {
		const input = this.getInput();
		const stateTensor = getStateTensor([input], this.height, this.width, this.channels);
		console.log('*************************');
		console.log(stateTensor.arraySync().map(v => v.map(c=> c.join('|')).join('\n')).join('\n'));
		console.log('*************************');
	}
	loose() {
		const player = this.env.players[this.playerId];
		return player.models.every(gameModelId => this.env.models[gameModelId].dead);
	}
}

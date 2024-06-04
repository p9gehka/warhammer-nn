import { Orders, Action } from './orders.js';
import { channels, getInput } from './nn-input.js';

import { getStateTensor } from '../utils/get-state-tensor.js';
import { eq } from '../utils/vec2.js';

export class PlayerEnvironment {
	width = 22;
	height = 22;
	channels = channels;
	vp = 0;
	_selectedModel = null;
	cumulativeReward = 0;

	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
		this.reset();
		this.orders = new Orders().getOrders();
	}

	reset() {
		this.primaryVP = 0;
		this.cumulativeReward = 0;
		this.lastRound = -1;
		this._selectedModel = 0;
	}

	step(order) {
		let playerOrder;
		const { action } = order;
		const prevState = this.env.getState();
		const playerModels = prevState.players[this.playerId].models;
		const round = prevState.round;
		if (this.lastRound !== round) {
			this.env.step({ action: Action.Move, vector: [0, 0], expense: 0, id: playerModels[this._selectedModel] });
			this.lastRound = round;
		}

		if (action === Action.Move) {
			playerOrder = {action, id: this._selectedModel, vector: order.vector, expense: order.expense };
		} else if (action === Action.NextPhase && playerModels.some((modelId, playerModelId) => prevState.modelsStamina[modelId] !== 0 && playerModelId !== this._selectedModel)){
			playerOrder = { action: Action.Move, vector: [0, 0], expense: 0, id: playerModels[this._selectedModel] };
		} else {
			playerOrder = order;
		}

		if (action === Action.NextPhase) {
			this._selectedModel = (this._selectedModel + 1) % playerModels.length;
			this.env.step({ action: Action.Move, vector: [0, 0], expense: 0, id: playerModels[this._selectedModel] });
		}


		const state = this.env.step(playerOrder);

		let reward = -0.5;

		if (action === Action.NextPhase) {
			reward -= 10;
		}
		this.cumulativeReward += reward;

		return [{ ...playerOrder, misc: state.misc }, state, reward];
	}
	awarding() {
		const state = this.env.getState();
		const { players } = state;
		let reward = 0;

		if (this.loose()) {
			reward -= this.env.objectiveControlReward * 4;/*( 3)*/
		}

		this.cumulativeReward += reward;
		return reward;
	}

	getState() {
		return { selected: this._selectedModel };
	}

	primaryReward() {
		const state = this.env.getState();
		const { primaryVP } = state.players[this.playerId];
		let reward = (primaryVP - this.primaryVP) * 5;
		this.cumulativeReward += reward;
		this.primaryVP = primaryVP;
		return reward;
	}

	getInput() {
		const state = this.env.getState();
		return getInput(state, this.getState());
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

import { Orders, Action } from './orders.js';
import { channels, getInput } from './nn-input.js';

import { getStateTensor } from '../utils/get-state-tensor.js';
import { eq } from '../utils/vec2.js';

export class PlayerEnvironment {
	width = 44;
	height = 30;
	channels = channels;
	vp = 0;
	_selectedModel = null;
	cumulativeReward = 0;

	_shootingQueue = [];
	_shootingTargeting = {};

	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.opponentId = (playerId+1) % 2;
		this.reset();
		this.orders = new Orders().getOrders();
		this._selectedModel = this.env.players[this.playerId].models[0];
	}

	reset() {
		this.primaryVP = 0;
		this.cumulativeReward = 0;
		this._selectedModel = 0;
	}

	step(order) {
		let playerOrder;
		const { action } = order;
		const prevState = this.env.getState();

		if (action === Action.Select) {
			this._selectedModel = this.env.players[this.playerId].models[order.id];
			playerOrder = { ...order, id: this._selectedModel };
		} else if (action === Action.SetTarget && this._selectedModel !== null) {
			const selectedWeapon = this._shootingQueue.at(-1);
			if (this._shootingTargeting[selectedWeapon] === undefined) {
				this._shootingTargeting[selectedWeapon] = {};
			}
			if (this._shootingTargeting[selectedWeapon][this._selectedModel] === undefined) {
				this._shootingTargeting[selectedWeapon][this._selectedModel] = [];
			}
			this._shootingTargeting[selectedWeapon][this._selectedModel].push(this.env.players[this.opponentId].units[order.id].id);
			if (this._shootingTargeting[selectedWeapon][this._selectedModel].length > this.env.gameSettings.rangedWeapons[this._selectedModel].filter(v=> v.name === selectedWeapon).length) {
				this._shootingTargeting[selectedWeapon][this._selectedModel].shift();
			}
			playerOrder = order;
		} else if (action === Action.Shoot && this._shootingQueue.length > 0) {
			let weapon;
			let shooter;
			while (this._shootingQueue.length > 0) {
				weapon = this._shootingQueue[0];
				shooter = Object.keys(this._shootingTargeting[weapon])[0];
				if (shooter !== undefined) {
					break;
				}
				delete this._shootingTargeting[weapon][shooter];
				this._shootingQueue.shift();
			}
			const target = this._shootingTargeting[weapon][shooter].shift();
			if (this._shootingTargeting[weapon][shooter].length === 0) {
				delete this._shootingTargeting[weapon][shooter];
			}

			if (Object.keys(this._shootingTargeting[weapon]).length === 0) {
				this._shootingQueue.shift();
			}

			playerOrder = {
				action: Action.Shoot,
				id: shooter,
				weaponId: this.env.gameSettings.rangedWeapons[shooter].map(w=> w.name).indexOf(weapon),
				target,
			};
		} else if (action === Action.Move) {
			playerOrder = { action, id: this._selectedModel, vector: order.vector, expense: order.expense };
		} else if (action === Action.SelectWeapon && this._selectedModel !== null) {
			const weaponName = this.env.gameSettings.rangedWeapons[this._selectedModel][order.id].name;
			this._shootingQueue = this._shootingQueue.filter(v => v !== weaponName);
			if (weaponName !== undefined) {
				this._shootingQueue.push(weaponName);

				if (this._shootingTargeting[weaponName] === undefined) {
					this._shootingTargeting[weaponName] = {};
				}
				if (this._shootingTargeting[weaponName][this._selectedModel]) {
					this._shootingTargeting[weaponName][this._selectedModel] = [];
				}
			}

			playerOrder = order;
		} else {
			playerOrder = order;
		}
		const state = this.env.step(playerOrder);

		let reward = -0.5;

		this.cumulativeReward += reward;

		return [{ ...playerOrder, misc: state.misc }, state, reward];
	}
	awarding() {
		const state = this.env.getState();
		const { players } = state;
		let reward = 0;

		this.cumulativeReward += reward;
		return reward;
	}

	getState() {
		return { selected: this._selectedModel, shootingQueue: this._shootingQueue, shootingTargeting: this._shootingTargeting };
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
		return getInput(state);
	}

	printStateTensor() {
		const input = this.getInput();
		const stateTensor = getStateTensor([input], this.height, this.width, this.channels);
		console.log('*************************');
		console.log(stateTensor.arraySync().map(v => v.map(c=> c.join('|')).join('\n')).join('\n'));
		console.log('*************************');
	}
}

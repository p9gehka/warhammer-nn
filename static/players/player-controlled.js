import { Action, Orders } from '../environment/orders.js';

export class PlayerControlled {
	_shootingQueue = [];
	_shootingTargeting = {};
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.opponentId = (playerId+1) % 2;
		this._selectedModel = this.env.players[this.playerId].models[0];
	}
	async playStep() {
		const orders = await this.orderPromise;
		return orders.reduce((_, order) => this._playStep(order), null);
	}
	_playStep(orderIndex) {
		const order = new Orders().getOrders().all[orderIndex];


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
		return [{ ...playerOrder, misc: state.misc }, state];
	}

	getState() {
		return { selected: this._selectedModel, shootingQueue: this._shootingQueue, shootingTargeting: this._shootingTargeting };
	}
	reset() {}
}

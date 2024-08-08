import { PlayerAction, playerOrders } from './player-orders.js';

export class PlayerControlled {
	_shootingQueue = [];
	_shootingTargeting = {};
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.opponentId = (playerId+1) % 2;
		this._selectedModel = 0;
	}
	async playStep() {
		const orders = await this.orderPromise;
		return orders.reduce((_, order) => this._playStep(order), null);
	}
	_playStep(orderIndex) {
		const order = playerOrders[orderIndex];

		let playerOrder;
		const { action } = order;
		const prevState = this.env.getState();

		if (action === PlayerAction.Select) {
			this._selectedModel = order.id;
			playerOrder = { ...order, id: this._getPlayerSelectedModel() };
		} else if (action === PlayerAction.SetTarget && this._selectedModel !== null) {
			const selectedWeapon = this._shootingQueue.at(-1);
			if (this._shootingTargeting[selectedWeapon] === undefined) {
				this._shootingTargeting[selectedWeapon] = {};
			}
			if (this._shootingTargeting[selectedWeapon][this._getPlayerSelectedModel()] === undefined) {
				this._shootingTargeting[selectedWeapon][this._getPlayerSelectedModel()] = [];
			}
			this._shootingTargeting[selectedWeapon][this._getPlayerSelectedModel()].push(this.env.players[this.opponentId].units[order.id].id);
			if (this._shootingTargeting[selectedWeapon][this._getPlayerSelectedModel()].length > this.env.gameSettings.rangedWeapons[this._getPlayerSelectedModel()].filter(v=> v.name === selectedWeapon).length) {
				this._shootingTargeting[selectedWeapon][this._getPlayerSelectedModel()].shift();
			}
			playerOrder = order;
		} else if (action === PlayerAction.Shoot && this._shootingQueue.length > 0) {
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
				action: PlayerAction.Shoot,
				id: shooter,
				weaponId: this.env.gameSettings.rangedWeapons[shooter].map(w=> w.name).indexOf(weapon),
				target,
			};
		} else if (action === PlayerAction.Move) {
			playerOrder = { action, id: this._getPlayerSelectedModel(), vector: order.vector, expense: order.expense };
		} else if (action === PlayerAction.SelectWeapon &&this._getPlayerSelectedModel() !== null) {
			const weaponName = this.env.gameSettings.rangedWeapons[this._getPlayerSelectedModel()][order.id].name;
			this._shootingQueue = this._shootingQueue.filter(v => v !== weaponName);
			if (weaponName !== undefined) {
				this._shootingQueue.push(weaponName);

				if (this._shootingTargeting[weaponName] === undefined) {
					this._shootingTargeting[weaponName] = {};
				}
				if (this._shootingTargeting[weaponName][this._getPlayerSelectedModel()]) {
					this._shootingTargeting[weaponName][this._getPlayerSelectedModel()] = [];
				}
			}

			playerOrder = order;
		} else {
			playerOrder = order;
		}


		const state = this.env.step(playerOrder);
		return [{ ...playerOrder, misc: state.misc }, state];
	}
	_getPlayerSelectedModel() {
		return this.env.players[this.playerId].models[this._selectedModel];
	}
	getState() {
		return { selected: this._selectedModel, shootingQueue: this._shootingQueue, shootingTargeting: this._shootingTargeting };
	}
	reset() {}
}

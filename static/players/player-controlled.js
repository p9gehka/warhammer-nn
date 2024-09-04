import { PlayerAction } from './player-orders.js';
import { shotDice } from './dice.js';
import { createArmyRules } from '../army-rules/army-rules.js';

export class PlayerControlled {
	_shootingQueue = [];
	_diceSequence = [];
	_shootingTargeting = {};
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.opponentId = (playerId+1) % 2;
		this._selectedModel = 0;
		this.armyRule = createArmyRules(this.env.gameSettings.armyRule[this.playerId]);
	}
	async playStep() {
		const orders = await this.orderPromise;
		return orders.reduce((_, order) => this._playStep(order), null);
	}
	_playStep(order) {
		let playerOrder;
		const { action } = order;
		const prevState = this.env.getState();

		if (action === PlayerAction.Select) {
			this._selectedModel = order.id;
			playerOrder = { ...order, id: this._getPlayerSelectedModel() };
		} else if (action === PlayerAction.SetTarget && this._selectedModel !== null && this._shootingQueue.length > 0) {
			const selectedWeapon = this._shootingQueue.at(-1);
			if (this._shootingTargeting[selectedWeapon] === undefined) {
				this._shootingTargeting[selectedWeapon] = {};
			}
			const weaponField = this._shootingTargeting[selectedWeapon];
			const selectedModel = this._getPlayerSelectedModel();
			if (weaponField[selectedModel] === undefined) {
				weaponField[selectedModel] = [];
			}
			weaponField[selectedModel].push(this.env.players[this.opponentId].units[order.id].id);
			if (weaponField[selectedModel].length > this.env.gameSettings.rangedWeapons[selectedModel].filter(v=> v.name === selectedWeapon).length) {
				weaponField[selectedModel].shift();
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
			if (shooter !== undefined) {
				const target = this._shootingTargeting[weapon][shooter].shift();
				if (this._shootingTargeting[weapon][shooter].length === 0) {
					delete this._shootingTargeting[weapon][shooter];
				}

				if (Object.keys(this._shootingTargeting[weapon]).length === 0) {
					this._shootingQueue.shift();
				}

				const weaponId = this.env.gameSettings.rangedWeapons[shooter].findIndex((w, i) => w.name === weapon && this.env.models[shooter].rangedWeaponLoaded[i]);
				const shotDiceResult = shotDice(this._diceSequence, this.env.models[shooter].getRangedWeapon(weaponId));
				this._diceSequence = [];
				playerOrder = {
					action: PlayerAction.Shoot,
					id: shooter,
					weaponId: weaponId,
					target,
					...shotDiceResult,
				};
			} else {
				playerOrder = order;
			}
		} else if (action === PlayerAction.Move) {
			playerOrder = { action, id: this._getPlayerSelectedModel(), vector: order.vector, expense: order.expense };
		} else if (action === PlayerAction.SelectWeapon &&this._getPlayerSelectedModel() !== null) {
			const weaponName = this.env.gameSettings.rangedWeapons[this._getPlayerSelectedModel()][order.id].name;
			this._shootingQueue = this._shootingQueue.filter(v => {
				if(v === weaponName) {
					return false;
				}
				if (this._shootingTargeting[v] !== undefined && Object.keys(this._shootingTargeting[v]).length === 0) {
					delete this._shootingTargeting[v];
					return false;
				}
				return true;
			});
	
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
		} else if (action === PlayerAction.SetDiceSequence) {
			this._diceSequence = order.sequence;
			playerOrder = order;
		} else {
			playerOrder = order;
		}

		if (this.armyRule?.waitOrder(playerOrder.action)) {
			playerOrder = this.armyRule?.playStep(playerOrder);
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

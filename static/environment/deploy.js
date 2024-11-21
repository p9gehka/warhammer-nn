import { deployment } from '../battlefield/deployment.js';

export const DeployAction = {
	DeployModel: 'DEPLOY_MODEL',
	NextPhase: 'NEXT_PHASE',
	Done: 'DONE',
}

class Model {
	position = [NaN, NaN];
	wound = 0;
	stamina = 0;
	deployed = false;
	constructor(id, unit, unitId, position, profile, categories = [], abilities = [], rules = []) {
		this.id = id;
		this.name = unit.name;
		this.abilities = abilities;
		this.playerId = unit.playerId;
		this.unitId = unitId;
		this.wounds = parseInt(profile.W);
		if (position !== null) {
			this.position = position;
		}
		this.categories = categories;
		this.rules = rules;
	}

	update(position) {
		this.position = position;
	}
}

export class Deploy {
	models = [];
	constructor(config) {
		this.battlefields = config?.battlefields;
		this.gameSettings = config?.gameSettings;

		this.reset();
		this.currentPlayer = 0;
		this._done = false;
	}
	reset() {
		const battlefieldsNames = Object.keys(this.battlefields);
		this.battlefield = this.battlefields[battlefieldsNames[0]];

		const units = this.gameSettings.units.map(
			(playerUnits, playerId) => playerUnits.map(unit => ({...unit, playerId }))
		);

		this.players = [
			{ units: units[0], models: units[0].map(unit => unit.models).flat(), primaryVP: 0, secondaryVP: 0 },
			{ units: units[1], models: units[1].map(unit => unit.models).flat(), primaryVP: 0, secondaryVP: 0 }
		];

		this.units = units.flat();
		this.models = this.units.map((unit, unitId) => unit.models.map(id => new Model(id, unit, unitId, null, this.gameSettings.modelProfiles[id], this.gameSettings.categories[unitId], this.gameSettings.rules[id], this.gameSettings.abilities[id]))).flat();

		return this.getState();
	}

	step(order) {
		if (this._done) {
			return this.getState();
		}

		if (order.action === DeployAction.DeployModel && deployment[this.battlefield.deployment]) {
			const deploy = new deployment[this.battlefield.deployment];
			const opponent = (this.currentPlayer + 1) % 2;
			const orderModel = this.models[order.id];
			if (!orderModel.deployed && (deploy.include(this.currentPlayer, order.position)
				|| (orderModel.abilities.includes('infiltrators') && !deploy.include(opponent, order.position)))
			) {
				orderModel.update(order.position);
				this.models.forEach(model => {
					if (!model.deployed && orderModel.unitId !== model.unitId) {
						model.update([NaN, NaN]);
					}
				});
			}
		}

		if (order.action === DeployAction.NextPhase || order.action === DeployAction.Done) {
			this.models.forEach(model => {
				model.deployed = !isNaN(model.position[0] + model.position[1]);
			})
			this.currentPlayer = (this.currentPlayer + 1) % 2;
		}
		if (order.action === DeployAction.Done) {
			this._done = true;
		}
		return this.getState();
	}
	getState(misc) {
		return {
			done: this._done,
			players: this.players,
			round: -1,
			units: this.units,
			models: this.models.map(model => model.position ),
			modelsStamina: this.models.map(model => 0),
			modelsWounds: this.models.map(model => model.wounds),
			player: this.currentPlayer,
			battlefield: this.battlefield,
			secondaryMissions: []
		};
	}
	getSettings() {
		return { ...this.gameSettings, models: this.models.map(model => model.position) }
	}
	getBattlefields() {
		return this.battlefields;
	}
}

export class DeployEnvironment {
	_selectedModel = null;
	_x = null;
	_y = null;
	constructor(playerId, env) {
		this.env = env;
		this.playerId = playerId;
		this.enemyId = (playerId+1) % 2;
	}

	step(order) {
		const currentState = this.env.getState();
		if (order.action === 'SELECT') {
			const selectedModel = this.env.players[this.playerId].models[order.id];
			if (selectedModel !== undefined) {
				this._selectedModel = selectedModel;
			}
			return currentState;
		}

		if(order.action === 'SET_X') {
			this._x = order.value;
			return currentState;
		}
		if(order.action === 'SET_Y') {
			this._y = order.value;
			return currentState;
		}
		if (order.action === 'DEPLOY_MODEL' && this._selectedModel !== null) {
			const id = this._selectedModel;
			return this.env.step({ action: 'DEPLOY_MODEL', id, position: [this._x, this._y] });
		}
		if (order.action === 'DONE' || order.action === 'NEXT_PHASE') {
			this._selectedModel = null;
			return this.env.step(order);
		}
		return currentState;
	}
	getState() { return { selected: this._selectedModel }; }
	reset() {
		this._x = null;
		this._y = null;
		this._selectedModel = null;
	}
}

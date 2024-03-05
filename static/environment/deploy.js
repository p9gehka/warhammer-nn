import tauUnits from '../settings/tau-units.json' assert { type: 'json' };
import tauWeapons from '../settings/tau-weapons.json' assert { type: 'json' };

export function getDeployOrders() {
	const all = []
	all.push({ action: 'NEXT_PHASE' });
	all.push({ action: 'DEPLOY_MODEL'});
	const setX = Array(60).fill().map((_, value) => ({ action: 'SET_X', value }));
	const setY = Array(44).fill().map((_, value) => ({ action: 'SET_Y', value }));
	all.push(...setX)
	all.push(...setY)

	return {
		setXIndexes: setX.map((_, i) => i + 2),
		setYIndexes: setY.map((_, i) => i + 2 + setX.length),
		all
	}
}

export const DeployAction = {
	DeployModel: 'DEPLOY_MODEL',
	NextPhase: 'NEXT_PHASE'
}

class Model {
	position = [NaN, NaN];
	wound = 0;
	stamina = 0;

	constructor(id, unit, position) {
		this.id = id;
		this.name = unit.name;
		this.playerId = unit.playerId;
		this.unitProfile = tauUnits[unit.name];
		if (position !== null) {
			this.position = position;
			this.dead = false;
			this.wound = this.unitProfile.w;
		}
	}

	update(position) {
		this.position = position;
	}
}

export class Deploy {
	constructor(config) {
		this.gameSettings = config?.gameSettings ?? gameSettings;
		this.battlefields = config?.battlefields ?? battlefields;
		this.reset();
		this.currentPlayer = 0;
	}
	reset() {
		const battlefieldsNames = Object.keys(this.battlefields);
		this.battlefield = this.battlefields[battlefieldsNames[0]];


		const units = this.gameSettings.units.map(
			(playerUnits, playerId) => playerUnits.map(unit => ({...unit, playerId }))
		);
		this.players = [
			{ units: units[0], models: units[0].map(unit => unit.models).flat(), vp: 0 },
			{ units: units[1], models: units[1].map(unit => unit.models).flat(), vp: 0 }
		];
		this.units = units.flat();
		this.models = this.units.map(unit => unit.models.map(id => new Model(id, unit, null))).flat();
		return this.getState();
	}
	step(order) {
		if (this.done()) {
			return this.getState();
		}

		if (order.action === DeployAction.DeployModel) {
			this.models[order.id].update(order.position);
		}

		if (order.action === DeployAction.NextPhase) {
			this.currentPlayer = (this.currentPlayer + 1) % 2
		}

		return this.getState();
	}
	done() {
		return false;
	}
	getState(misc) {
		return {
			players: this.players,
			units: this.units,
			models: this.models.map(model => !model.dead ? model.position : null),
			modelsStamina: this.models.map(model => 0),
			player: this.currentPlayer,
			battlefield: this.battlefield
		};
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
		this._selectedModel = this.env.players[this.playerId].models[0];
	}

	step(order) {
		if(order.action === 'SET_X') {
			this._x = order.value
			return this.env.getState();
		}
		if(order.action === 'SET_Y') {
			this._y = order.value;
			return this.env.getState();
		}
		if (order.action === 'DEPLOY_MODEL') {
			return this.env.step({ action: 'DEPLOY_MODEL', id: this._selectedModel, position: [this._x, this._y] });
		}

		return this.env.step(order);
	}
	getState() { return { selected: this._selectedModel }; }
}

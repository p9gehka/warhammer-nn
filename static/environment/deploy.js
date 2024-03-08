
export function getDeployOrders() {
	const all = [];
	all.push({ action: 'NEXT_PHASE' });
	all.push({ action: 'DEPLOY_MODEL'});
	all.push({ action: 'DONE' });
	const select = Array(30).fill().map((_, id) => ({ action: 'SELECT', id }));
	const setX = Array(60).fill().map((_, value) => ({ action: 'SET_X', value }));
	const setY = Array(44).fill().map((_, value) => ({ action: 'SET_Y', value }));
	all.push(...select);
	all.push(...setX);
	all.push(...setY);

	return {
		selectIndexes: setX.map((_, i) => i + 3),
		setXIndexes: setX.map((_, i) => i + 3 + select.length),
		setYIndexes: setY.map((_, i) => i + 3 + select.length + setX.length),
		doneIndex: 2,
		all
	}
}

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
	constructor(id, unit, position) {
		this.id = id;
		this.name = unit.name;
		this.playerId = unit.playerId;
		if (position !== null) {
			this.position = position;
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
		this._done = false;
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
		if (this._done) {
			return this.getState();
		}

		if (order.action === DeployAction.DeployModel) {
			this.models[order.id].update(order.position);
		}

		if (order.action === DeployAction.NextPhase) {
			this.models.forEach(model => {
				model.deployed = !isNaN(model.position[0] + model.position[1]);
			})
			this.currentPlayer = (this.currentPlayer + 1) % 2
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
			models: this.models.map(model => !model.dead ? model.position : null),
			modelsStamina: this.models.map(model => 0),
			player: this.currentPlayer,
			battlefield: this.battlefield
		};
	}
	getSettings() {
		return { ...this.gameSettings, models: this.models.map(model => model.position) }
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
		this._selectedModel = null;
	}

	step(order) {
		const currentState = this.env.getState();
		if (order.action === 'SELECT') {

			const selectedModel = this.env.players[this.playerId].models[order.id];
			if (!this.env.models[selectedModel].deployed) {
				this._selectedModel = selectedModel;
			}
			return currentState;
		}

		if(order.action === 'SET_X') {
			this._x = order.value
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
}

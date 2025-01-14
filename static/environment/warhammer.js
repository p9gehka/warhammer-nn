import { MissionController} from './mission.js';

import { mul, len, sub, add, eq, scaleToLen, round } from '../utils/vec2.js'
import { getRandomInteger } from '../utils/index.js';

export const Phase = {
	Movement: 0,
}

const phaseOrd = [Phase.Movement];

export const BaseAction = {
	NextPhase: 'NEXT_PHASE',
	Move: 'MOVE',
}

class Model {
	position = [NaN, NaN];
	wound = 0;
	dead = true;

	constructor(id, unit, position, profile) {
		this.id = id;
		this.name = unit.name;
		this.playerId = unit.playerId;
		this.unitProfile = {
			"m": parseInt(profile.M),
			"oc": parseInt(profile.OC),
		};

		this.stamina = 0;
		this.position = position;
		this.dead = false;
		this.wounds = this.unitProfile.w;
		this.deployed = !isNaN(position[0]);
	}

	update(position) {
		if (!this.dead) {
			this.position = position;
		}
	}
	updateAvailableToMove(value) {
		if (!isNaN(this.position[0])) {
			this.stamina = value ? this.unitProfile.m : 0;
		}
	}
	decreaseStamina(value) {
		this.stamina = Math.max(0, this.stamina - value);
	}

	kill() {
		if (this.dead) {
			return;
		}
		this.wound = 0;
		this.stamina = 0;
		this.dead = true;
		this.position = [NaN, NaN];
	}
}

export class Warhammer {
	players = [];
	units = [];
	models = [];
	phase = Phase.Movement;
	turn = 0;
	started = false;
	objectiveControlReward = 5;
	totalRounds = 5;
	constructor(config) {
		this.missions = [
			new MissionController('TakeAndHold', 'ChillingRain'),
			new MissionController('TakeAndHold', 'ChillingRain')
		]
		this.gameSettings = config.gameSettings;
		this.battlefields = config.battlefields;
		this.reset();
	}
	reset() {
		const battlefieldsNames = Object.keys(this.battlefields);
		this.battlefield = this.battlefields[battlefieldsNames[getRandomInteger(0, battlefieldsNames.length)]];

		this.phase = Phase.Movement;
		this.turn = 0;
		this.started = false;
		let unitCounter = 0;

		const units = this.gameSettings.units.map(
			(playerUnits, playerId) => playerUnits.map(unit => {
				const result = ({...unit, playerId, id: unitCounter });
				unitCounter++;
				return result;
			})
		);
		this.players = [
			{ units: units[0], models: units[0].map(unit => unit.models).flat(), primaryVP: 0 },
			{ units: units[1], models: units[1].map(unit => unit.models).flat(), primaryVP: 0 }
		];
		this.units = units.flat();

		const usedPosition = [];
		this.models = this.units.map((unit, unitId) => {
			return unit.models.map(id => {
				if (this.gameSettings.models.length !== 0 && this.gameSettings.models[id] !== undefined && this.gameSettings.models[id] !== null) {
					return new Model(id, unit, this.gameSettings.models[id], this.gameSettings.modelProfiles[id]);
				}
				usedPosition.push(this.getRandomStartPosition(usedPosition));
				return new Model(id, unit, usedPosition.at(-1), this.gameSettings.modelProfiles[id]);
			});
		}).flat();

		this.missions.forEach(mission => mission.reset());
		this.models.forEach(model => {
			if (model.playerId === 0) {
				model.updateAvailableToMove(true);
			}
		});
		return this.getState();
	}
	getRandomStartPosition(exclude) {
		while(true) {
			let x1 = getRandomInteger(0, this.battlefield.size[0]);
			let y1 = getRandomInteger(0, this.battlefield.size[1]);
			if (!exclude.some(pos => eq([x1, y1], pos))) {
				return [x1, y1];
			}
		}
	}

	step(order) {
		if (this.done()) {
			return this.getState();
		}

		if (order.action === BaseAction.NextPhase) {
			this.missions[this.getPlayer()].startTurn(this.getState(), this.models.map(m => m.unitProfile));
			this.players[this.getPlayer()].primaryVP += this.scorePrimaryVP();

			this.models.forEach(model => model.updateAvailableToMove(false));

			if (this.phase === phaseOrd.at(-1)) {
				this.turn++;
			}
			this.phase = phaseOrd[(this.phase + 1) % phaseOrd.length];
		}

		const currentPlayerId = this.getPlayer();
		if (order.action === BaseAction.NextPhase) {
			if (this.phase === Phase.Movement) {
				this.models.forEach((model) => {
					if (model.playerId === currentPlayerId) {
						model.updateAvailableToMove(true);
					}
				});
			}

			return this.getState();
		}

		const model = this.models[order.id];

		if (order.action === BaseAction.Move && model !== undefined) {
			let vectorToMove = order.vector;
			if (order.expense > model.stamina) {
				vectorToMove = [0, 0];
			}
			model.decreaseStamina(order.expense);
			const newPosition = add(model.position, vectorToMove);
			const [x, y] = newPosition;
			if(0 <= x && x < this.battlefield.size[0] && 0 <= y && y < this.battlefield.size[1]) {
				model.update(newPosition);
			}
		}

		return this.getState();
	}

	getPlayer() { return this.turn % 2; }

	done() {
		const ids = this.models.filter(model => !model.dead).map(model => model.playerId);

		return this.turn > (this.totalRounds * 2) - 1 || new Set(ids).size === 1;
	}
	end() {
		this.turn = (this.totalRounds * 2);
	}
	scorePrimaryVP() {
		return this.missions[this.getPlayer()].scorePrimaryVP(this.getState());
	}

	getState(misc) {
		return {
			players: this.players,
			units: this.units,
			models: this.models.map(model => model.position),
			modelsStamina: this.models.map(model => model.stamina),
			phase: this.phase,
			player: this.getPlayer(),
			done: this.done(),
			modelsStamina: this.models.map(model => model.stamina),
			misc: misc ?? {},
			battlefield: this.battlefield,
			turn: this.turn,
			round: Math.floor(this.turn / 2),
		};
	}
}
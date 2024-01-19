import gameSettings from '../static/settings/game-settings0.1.json' assert { type: 'json' };
import tauUnits from '../static/settings/tau-units.json' assert { type: 'json' };
import tauWeapons from '../static/settings/tau-weapons.json' assert { type: 'json' };
import battlefields from '../static/settings/battlefields-small.json' assert { type: 'json' };

import { mul, len, sub, add, round, eq } from '../static/utils/vec2.js'
import { getRandomInteger } from '../static/utils/index.js';


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
	availableToMove = false;
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
		if (!this.dead) {
			this.position = position;
		}
	}

	updateAvailableToMove(value) {
		if (!this.dead) {
			this.availableToMove = value
		}
	}

	kill() {
		if (this.dead) {
			return;
		}
		this.wound === 0;
		this.dead = true;
	}
}

export class Warhammer {
	players = [];
	units = [];
	models = [];
	phase = Phase.Movement;
	turn = 0;
	objectiveControlReward = 5;
	totalRounds = 5;
	constructor(config) {
		this.gameSettings = config?.gameSettings ?? gameSettings;
		this.battlefields = config?.battlefields ?? battlefields;
		this.reset();
	}
	reset() {
		const battlefieldsNames = Object.keys(this.battlefields);
		this.battlefield = this.battlefields[battlefieldsNames[getRandomInteger(0, battlefieldsNames.length)]];

		this.phase = Phase.Movement;
		this.turn = 0

		const units = this.gameSettings.units.map(
			(playerUnits, playerId) => playerUnits.map(unit => ({...unit, playerId }))
		);
		this.players = [
			{ units: units[0], models: units[0].map(unit => unit.models).flat(), vp: 0 },
			{ units: units[1], models: units[1].map(unit => unit.models).flat(), vp: 0 }
		];
		this.units = units.flat();

		const usedPosition = [];
		this.models = this.units.map(unit => {
			return unit.models.map(id => {
				if (this.gameSettings.models.length !== 0 && this.gameSettings.models[id] !== undefined) {
					return new Model(id, unit, this.gameSettings.models[id]);
				}
				usedPosition.push(this.getRandomStartPosition(usedPosition));
				return new Model(id, unit, usedPosition.at(-1));
			});
		}).flat();

		this.models.forEach(model => {
			if (model.playerId === this.getPlayer()) {
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
			this.models.forEach(model => model.updateAvailableToMove(false));

			if (this.phase === phaseOrd.at(-1)) {
				this.turn++;
			}
			this.phase = phaseOrd[(this.phase + 1) % phaseOrd.length];
		}

		const currentPlayerId = this.getPlayer();
		if (order.action === BaseAction.NextPhase) {
			if (this.phase === Phase.Movement) {
				this.players[currentPlayerId].vp += this.scoreVP();
				this.models.forEach((model) => {
					if (model.playerId === currentPlayerId) {
						model.updateAvailableToMove(true);
					}
				});
			}

			return this.getState();
		}

		const model = this.models[order.id];

		if (order.action === BaseAction.Move) {
			if (!model.availableToMove) {
				return this.getState();
			}
			model.updateAvailableToMove(false);

			if (len(order.vector) > 0) {
				const movementVector = mul(order.vector, model.unitProfile.m);
				const newPosition = add(model.position, movementVector);

				if (!this.models.some(m => eq(round(m.position), round(newPosition)) && !m.dead)) {
					model.update(newPosition);
				}
			}
			this.models.forEach(model => {
				const [x, y] = model.position;
				if (x < 0 || this.battlefield.size[0] < x || y < 0 || this.battlefield.size[1] < y) {
					model.kill();
				}
			});
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
	scoreVP() {
		const objectiveControl = Array(this.battlefield.objective_marker.length).fill(0);

		this.models.forEach((model) => {
			this.battlefield.objective_marker.forEach((markerPosition, i) => {
				if (len(sub(model.position, markerPosition)) < this.gameSettings.objective_marker_control_distance) {
					const ocSign = model.playerId === this.getPlayer() ? 1 : -1;
					const oc = model.unitProfile.oc * ocSign;
					objectiveControl[i] =+ oc;
				}
			});
		});

		return Math.min(objectiveControl.filter(oc => oc > 0).length * this.objectiveControlReward, 15);
	}

	getState(misc) {
		return {
			players: this.players,
			units: this.units,
			models: this.models.map(model => !model.dead ? model.position : null),
			phase: this.phase,
			player: this.getPlayer(),
			done: this.done(),
			availableToMove: this.models.filter(model => model.availableToMove).map(model=> model.id),
			misc: misc ?? {},
			battlefield: this.battlefield,
			turn: this.turn,
			round: Math.floor(this.turn / 2),
		};
	}
}
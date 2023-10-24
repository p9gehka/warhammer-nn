import gameSettings from '../static/settings/game-settings.json' assert { type: 'json' };
import tauUnits from '../static/settings/tau-units.json' assert { type: 'json' };

import { scaleToLen, len, sub, add, round2 } from '../static/utils/vec2.js';

const { battlefield, models } = gameSettings;
const { size } = battlefield;


const Phase = {
	Movement: 0,
	Shooting: 1,
}

const phaseOrd = [Phase.Movement, Phase.Shooting];

const Action = {
	NextPhase: 'NEXT_PHASE',
	Move: 'MOVE',
	Shoot: 'SHOOT',
}

class Model {
	position = [0, 0];
	constructor(unit, position) {
		this.name = unit.name;
		this.palayerId = unit.playerId;
		this.position = position;
		this.unitProfile = tauUnits[unit.name];
	}

	update(position) {
		this.position = position;
	}
}

export default class Warhammer {
	payer = [];
	units = [];
	models = [];
	phase = Phase.Movement;

	reset() {
		this.phase = Phase.Movement;
		const units = gameSettings.units.map(
			(units, playerId) => units.map(unit => ({...unit, playerId }))
		);
		this.players = [{ units: units[0], vp: 0 }, { units: units[1], vp: 0 }]
		this.units = units.flat();

		this.models = this.units.map(unit => {
			return unit.models.map(id => new Model(unit, models[id]));
		}).flat();

		return this.getState();
	}

	step(order) {
		if (order.action === Action.NextPhase) {
			this.phase = phaseOrd[this.phase % phaseOrd.lenth];
			return this.getState();
		}

		if (this.phase === Phase.Movement && order.action === Action.Move) {
			const model = this.models[order.id];
			const modelMovement = model.unitProfile.m;
			let movementVector = sub(order.position, model.position)

			if (len(movementVector) > modelMovement) {
				movementVector = scaleToLen(movementVector, modelMovement);
			}
			model.update(add(model.position, movementVector));
		}

		if (this.phase === Phase.Shooting && order.action === Action.Shoot) {
			console.log(shoot);
			console.log(order.model, order.target);
		}

		return this.getState();
	}

	getState() {
		return {
			players: this.players,
			units: this.units,
			models: this.models.map(model => model.position),
			phase: this.phase
		};
	}
}

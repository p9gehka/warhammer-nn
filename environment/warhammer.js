import gameSettings from '../static/settings/game-settings.json' assert { type: 'json' };
import tauUnits from '../static/settings/tau-units.json' assert { type: 'json' };
import tauWeapons from '../static/settings/tau-weapons.json' assert { type: 'json' };

import { scaleToLen, len, sub, add, round2 } from '../static/utils/vec2.js';

const { battlefield, models } = gameSettings;
const { size, objective_marker, objective_marker_control_distance } = battlefield;


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

function d6() {
	const edge = [1,2,3,4,5,6].map(() => Math.random())
	return edge.findIndex((v) => v ===Math.max(...edge)) + 1;
}

class Model {
	position = [0, 0];
	wound = 0;
	dead = false;
	constructor(unit, position) {
		this.name = unit.name;
		this.playerId = unit.playerId;
		this.position = position;
		this.unitProfile = tauUnits[unit.name];
		this.availableToMove = true;
		this.availableToShoot = false;
		this.wound = this.unitProfile.w;
		this.dead = false;
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
	updateAvailableToShoot(value) {
		if (!this.dead) {
			this.availableToShoot = value
		}
	}
	inflictDamapge(value) {
		if (this.dead) {
			return;
		}
		this.wound -= value;
		if (this.wound <= 0) {
			this.dead = true;
			this.wound = 0
		}
	}
}

export default class Warhammer {
	players = [];
	units = [];
	models = [];
	phase = Phase.Movement;
	turn = 0
	reset() {
		this.phase = Phase.Movement;
		this.turn = 0
		this.round = 0 

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
		const currentPlayerId = this.getPlayer();
		if (order.action === Action.NextPhase) {
			this.phase = phaseOrd[(this.phase + 1) % phaseOrd.length];
			if (this.phase === phaseOrd.at(-1)) {
				this.turn++;
			}
			if (this.phase === Phase.Movement) {
				this.players[currentPlayerId].vp += this.scoreVP();
				this.models.forEach((model) => {
					if (model.playerId === currentPlayerId) {
						model.updateAvailableToMove(true);
					}
				})

			}

			if (this.phase === Phase.Shooting) {
				this.models.forEach((model) => {
					if (model.playerId === currentPlayerId) {
						model.updateAvailableToShoot(true);
					}
				})

			}

			return this.getState();
		}

		const model = this.models[order.id];

		if (order.action === Action.Move) {
			if (!model.availableToMove) {
				return this.getState();
			}

			const modelMovement = model.unitProfile.m;
			let movementVector = sub(order.position, model.position)

			if (len(movementVector) > modelMovement) {
				movementVector = scaleToLen(movementVector, modelMovement);
			}

			model.update(add(model.position, movementVector));
			model.updateAvailableToMove(false);
		}

		if (order.action === Action.Shoot) {
			if (!model.availableToShoot) {
				return this.getState();
			}


			const weapon = tauWeapons[model.unitProfile.ranged_weapons[0]];
			const targetModel = this.models[order.target];

			if (weapon.range >= len(sub(targetModel.position, model.position))) {
				const targetToughness = targetModel.unitProfile.t;
				const targetSave = targetModel.unitProfile.sv;

				const hits = Array(weapon.a).fill(0).map(() => d6())
				const wounds = hits.filter(v => v >= weapon.bs).map(() => d6());
				const saves = wounds.filter(v => v >= this.strenghtVsToughness(weapon.s, targetToughness)).map(() => d6());
				const saveFails = saves.filter(v => v < (targetSave + weapon.ap)).length
				targetModel.inflictDamapge(saveFails * weapon.d);
				return this.getState({ hits, wounds, saves });
			}
		}

		return this.getState();
	}

	strenghtVsToughness(strength, toughness) {
		if (strength >= toughness * 2) {
			return 2;
		}
		if (strength > toughness) {
			return 3;
		}
		if (strength < toughness) {
			return 5;
		}
		if (strength * 2 <= toughness) {
			return 6;
		}

		return 4;
	}
	getPlayer() {
		return this.turn % 2;
	}

	scoreVP() {
		const objectiveControl = Array(objective_marker.length).fill(0);

		this.models.forEach((model) => {
			objective_marker.forEach((markerPosition, i) => {
				if (len(sub(model.position, markerPosition)) < objective_marker_control_distance) {
					const ocSign = model.playerId === this.getPlayer() ? 1 : -1;
					const oc = model.unitProfile.oc * ocSign;
					objectiveControl[i] =+ oc;
				}
			});
		});

		return Math.min(objectiveControl.filter(oc => oc > 0).length * 5, 15)
	}

	getState(misc) {
		return {
			players: this.players,
			units: this.units,
			models: this.models.map(model => !model.dead ? model.position : null),
			phase: this.phase,
			player: this.getPlayer(),
			misc,
		};
	}
}

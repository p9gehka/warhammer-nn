import gameSettings from '../static/settings/game-settings0.1.json' assert { type: 'json' };
import tauUnits from '../static/settings/tau-units.json' assert { type: 'json' };
import tauWeapons from '../static/settings/tau-weapons.json' assert { type: 'json' };

import { scaleToLen, len, sub, add } from '../static/utils/vec2.js';

const { battlefield, models } = gameSettings;
const { size, objective_marker, objective_marker_control_distance } = battlefield;


export const Phase = {
	Movement: 0,
	Shooting: 1,
}

const phaseOrd = [Phase.Movement, Phase.Shooting];

export const Action = {
	NextPhase: 'NEXT_PHASE',
	Move: 'MOVE',
	Shoot: 'SHOOT',
}

function d6(n) {
	if (n) {
		return n
	}
	const edge = [1,2,3,4,5,6].map(() => Math.random())
	return edge.findIndex((v) => v ===Math.max(...edge)) + 1;
}

class Model {
	position = [0, 0];
	wound = 0;
	dead = false;
	constructor(id, unit, position) {
		this.id = id;
		this.name = unit.name;
		this.playerId = unit.playerId;
		this.position = position;
		this.unitProfile = tauUnits[unit.name];
		this.availableToMove = false;
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
	inflictDamage(value) {
		if (this.dead) {
			return;
		}
		this.wound -= value;
		if (this.wound <= 0) {
			this.dead = true;
			this.wound = 0
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
	turn = 0
	battlefield = battlefield;
	reset() {
		this.phase = Phase.Movement;
		this.turn = 0

		const units = gameSettings.units.map(
			(units, playerId) => units.map(unit => ({...unit, playerId }))
		);
		this.players = [{ units: units[0], models: units[0].map(unit => unit.models).flat(), vp: 0 }, { units: units[1], models: units[1].map(unit => unit.models).flat(), vp: 0 }]
		this.units = units.flat();

		this.models = this.units.map(unit => {
			return unit.models.map(id => new Model(id, unit, models[id]));
		}).flat();

		this.models.forEach((model) => {
			if (model.playerId === this.getPlayer()) {
				model.updateAvailableToMove(true);
			}
		})

		return this.getState();
	}

	step(order) {
		if (this.done()) {
			return this.getState();
		}

		if (order.action === Action.NextPhase) {
			this.models.forEach(model => model.updateAvailableToMove(false));
			this.models.forEach(model => model.updateAvailableToShoot(false));

			if (this.phase === phaseOrd.at(-1)) {
				this.turn++;
			}
			this.phase = phaseOrd[(this.phase + 1) % phaseOrd.length];
			this.models.forEach(model => {
				const [x, y] = model.position;
				if (x < 0 || size[0] < x || y < 0 || size[1] < y) {
					model.kill();
				}
			})
		}

		const currentPlayerId = this.getPlayer();
		if (order.action === Action.NextPhase) {
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
			model.updateAvailableToMove(false);
			if (len(order.vector) > 0) {
				const movementVector = scaleToLen(order.vector, model.unitProfile.m)
				model.update(add(model.position, movementVector));
			}
		}

		if (order.action === Action.Shoot) {
			if (!model.availableToShoot || !this.models[order.target]) {
				return this.getState();
			}

			model.updateAvailableToShoot(false);

			const weapon = tauWeapons[model.unitProfile.ranged_weapons[0]];
			const targetModel = this.models[order.target];

			if (weapon.range >= len(sub(targetModel.position, model.position)) && !targetModel.dead) {
				const targetToughness = targetModel.unitProfile.t;
				const targetSave = targetModel.unitProfile.sv;
				const hits = Array(weapon.a).fill(0).map(d6);
				const wounds = hits.filter(v => v >= weapon.bs).map(d6);
				const saves = wounds.filter(v => v >= this.strenghtVsToughness(weapon.s, targetToughness)).map(d6);
				const saveFails = saves.filter(v => v < (targetSave + weapon.ap)).length
				targetModel.inflictDamage(saveFails * weapon.d);
				return this.getState({ hits, wounds, saves, targetPosition: targetModel.position });
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

	getPlayer() { return this.turn % 2 }
	setDone() { this.turn = 10 }
	done() {
		const ids = this.models.filter(model => !model.dead).map(model => model.playerId);
		return this.turn > 9 || Math.min(...ids) === Math.max(...ids);
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
			players: this.players.map(player => ({ ...player })),
			units: this.units,
			models: this.models.map(model => !model.dead ? model.position : null),
			phase: this.phase,
			player: this.getPlayer(),
			done: this.done(),
			availableToMove: this.models.filter(model => model.availableToMove).map(model=> model.id),
			availableToShoot: this.models.filter(model => model.availableToShoot).map(model=> model.id),
			misc,
			battlefield,
			turn: this.turn,
		};
	}
}

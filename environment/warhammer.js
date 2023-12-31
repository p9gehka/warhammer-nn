import gameSettings from '../static/settings/game-settings0.1.json' assert { type: 'json' };
import tauUnits from '../static/settings/tau-units.json' assert { type: 'json' };
import tauWeapons from '../static/settings/tau-weapons.json' assert { type: 'json' };
import battlefields from '../static/settings/battlefields.json' assert { type: 'json' };

import { mul, len, sub, add, round, eq } from '../static/utils/vec2.js'
import { getRandomInteger } from '../static/utils/index.js';


export const Phase = {
	Movement: 0,
	Shooting: 1,
}

const phaseOrd = [Phase.Movement, Phase.Shooting];

export const BaseAction = {
	NextPhase: 'NEXT_PHASE',
	Move: 'MOVE',
	Shoot: 'SHOOT',
}

function d6() {
	const edge = [1,2,3,4,5,6].map(() => Math.random());
	return edge.findIndex((v) => v ===Math.max(...edge)) + 1;
}

class Model {
	position = [NaN, NaN];
	wound = 0;
	dead = true;
	availableToMove = false;
	availableToShoot = false;
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
	updateAvailableToShoot(value) {
		if (!this.dead && this.unitProfile.ranged_weapons.length > 0) {
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
			this.wound = 0;
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
				if (this.gameSettings.models.length !== 0) {
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
			this.models.forEach(model => model.updateAvailableToShoot(false));

			if (this.phase === phaseOrd.at(-1)) {
				this.turn++;
			}
			this.phase = phaseOrd[(this.phase + 1) % phaseOrd.length];
			this.models.forEach(model => {
				const [x, y] = model.position;
				if (x < 0 || this.battlefield.size[0] < x || y < 0 || this.battlefield.size[1] < y) {
					model.kill();
				}
			});
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

			if (this.phase === Phase.Shooting) {
				this.models.forEach((model) => {
					if (model.playerId === currentPlayerId) {
						model.updateAvailableToShoot(true);
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
		}

		if (order.action === BaseAction.Shoot) {
			if (!model.availableToShoot) {
				return this.getState();
			}

			model.updateAvailableToShoot(false);
			const targetModel = this.models[order.target];
			if (targetModel !== null && this.canShoot(model, targetModel)) {
				const weapon = tauWeapons[model.unitProfile.ranged_weapons[0]];
				const targetToughness = targetModel.unitProfile.t;
				const targetSave = targetModel.unitProfile.sv;
				const hits = Array(weapon.a).fill(0).map(d6);
				const wounds = hits.filter(v => v >= weapon.bs).map(d6);
				const saves = wounds.filter(v => v >= this.strenghtVsToughness(weapon.s, targetToughness)).map(d6);
				const saveFails = saves.filter(v => v < (targetSave + weapon.ap)).length;
				targetModel.inflictDamage(saveFails * weapon.d);
				return this.getState({ hits, wounds, saves, targetPosition: targetModel.position });
			}
		}

		return this.getState();
	}
	canShoot(model, targetModel) {
		const weapon = tauWeapons[model.unitProfile.ranged_weapons[0]];
		return !targetModel.dead && weapon.range >= len(sub(model.position, targetModel.position)) && this.battlefield.ruins.every(ruin => getLineIntersection([targetModel.position, model.position], [ruin.at(0), ruin.at(-1)]) === null);
	}

	strenghtVsToughness(s, t) {
		return [s >= t * 2, s > t, s === t, s < t && t < s * 2, s * 2 <= t].findIndex(v=> v) + 2;
	}

	getPlayer() { return this.turn % 2; }

	done() {
		const ids = this.models.filter(model => !model.dead).map(model => model.playerId);
		return this.turn > 9 || Math.min(...ids) === Math.max(...ids);
	}
	end() {
		this.turn = 10;
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
			availableToShoot: this.models.filter(model => model.availableToShoot).map(model=> model.id),
			misc: misc ?? {},
			battlefield: this.battlefield,
			turn: this.turn,
		};
	}
}

function getLineIntersection([[p0_x, p0_y], [p1_x, p1_y]], [[p2_x, p2_y], [p3_x, p3_y]]) {
	const s1_x = p1_x - p0_x;
	const s1_y = p1_y - p0_y;
	const s2_x = p3_x - p2_x;
	const s2_y = p3_y - p2_y;

	const s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
	const t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

	if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
		return [p0_x + (t * s1_x), p0_y + (t * s1_y)];
	}
	return null;
}

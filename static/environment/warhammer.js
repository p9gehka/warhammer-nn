import { MissionController} from './mission.js';
import { terrain } from '../battlefield/terrain.js';
import { mul, len, sub, add, eq, scaleToLen, round } from '../utils/vec2.js'
import { getRandomInteger } from '../utils/index.js';

export const Phase = {
	Command: 0,
	Movement: 1,
	Shooting: 2,
}

const phaseOrd = [Phase.Command, Phase.Movement, Phase.Shooting];

export const BaseAction = {
	NextPhase: 'NEXT_PHASE',
	Move: 'MOVE',
	Shoot: 'SHOOT',
}

function parseCharacteristic(value) {
	let result = value[0] === 'D' ? '1' + value : value;
	result = result.indexOf('D') === -1 ? ('0D6+' + result) : result;
	result = result.indexOf('+') === -1 ? (result + '+0') : result;
	const [diceTotal, tail] = result.split('D');
	const [dice, constant] = tail.split('+');
	return { diceTotal: parseInt(diceTotal), constant: parseInt(constant), dice: 'd'+dice };
}

class Model {
	position = [NaN, NaN];
	wound = 0;
	dead = true;
	stamina = 0;

	constructor(id, unit, position, profile, rangedWeapons) {
		this.id = id;
		this.name = unit.name;
		this.playerId = unit.playerId;
		this.unitProfile = {
			"m": parseInt(profile.M),
			"oc": Number(profile.OC),
			"w": parseInt(profile.W)
		};

		this.stamina = 0;

		this._rangedWeapons = rangedWeapons.map(weaponProfile  => {
			return {
				a: parseCharacteristic(weaponProfile.A),
				ap: parseInt(weaponProfile.AP),
				bs: parseInt(weaponProfile.BS),
				d: parseCharacteristic(weaponProfile.D),
				range: parseInt(weaponProfile.Range),
				s: parseInt(weaponProfile.S),
				name: weaponProfile.name,
			}
		});
		this.rangedWeaponLoaded = Array(rangedWeapons.length).fill(false);

		this.position = position;
		this.dead = false;
		this.wounds = this.unitProfile.w;
		this.deployed = !isNaN(position[0]);
	}
	getRangedWeapon(weaponId) {
		return this._rangedWeapons[weaponId];
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

	updateAvailableToShoot(value) {
		if (!isNaN(this.position[0])) {
			this.rangedWeaponLoaded = this.rangedWeaponLoaded.map(_=> value)
		}
	}
	isAvailableToShoot() {
		return this.rangedWeaponLoaded.some(v=>v);
	}

	kill() {
		if (this.dead) {
			return;
		}
		this.wounds = 0;
		this.stamina = 0;
		this.dead = true;
		this.position = [NaN, NaN];
	}
	inflictDamage(value) {
		if (this.dead) {
			return;
		}
		this.wounds -= value;
		if (this.wounds <= 0) {
			this.kill();
		}
	}
}

export class Warhammer {
	players = [];
	units = [];
	models = [];
	phase = Phase.Movement;
	phase = phaseOrd[0];
	objectiveControlReward = 5;
	totalRounds = 5;
	lastMovedModelId = undefined;
	lastShootedModelId = undefined;
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
		let unitCounter = 0;

		const units = this.gameSettings.units.map(
			(playerUnits, playerId) => playerUnits.map((unit, id) => {
				const result = ({...unit, playerId, id, gameId: unitCounter });
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
			let lastPosition = null;
			return unit.models.map(id => {
				if (this.gameSettings.models.length !== 0 && this.gameSettings.models[id] !== undefined && this.gameSettings.models[id] !== null) {
					return new Model(id, unit, this.gameSettings.models[id], this.gameSettings.modelProfiles[id]);
				}
				usedPosition.push(this.getRandomStartPosition(usedPosition, lastPosition));
				lastPosition = usedPosition.at(-1);
				return new Model(id, unit, lastPosition, this.gameSettings.modelProfiles[id], this.gameSettings.rangedWeapons[id]);;
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
	getRandomStartPosition(exclude, lastPosition) {
		let tries = 0;
		while(true) {
			let x, y;
			if (lastPosition === null) {
				x = getRandomInteger(0, this.battlefield.size[0]);
				y = getRandomInteger(0, this.battlefield.size[1]);
			} else {
				const padding = Math.floor(tries / 4)
				x = lastPosition[0] + getRandomInteger(0, 6 + padding) - (3 + Math.floor(padding/2));
				y = lastPosition[1] + getRandomInteger(0, 6 + padding) - (3 + Math.floor(padding/2));
			}
			if (!exclude.some(pos => eq([x, y], pos)) && 0 <= x && x < this.battlefield.size[0] && 0 <= y && y < this.battlefield.size[1]) {
				return [x, y];
			}
			tries++;
		}
	}

	step(order) {
		if (this.done()) {
			return this.getState();
		}

		if (order.action === BaseAction.NextPhase) {
			if (this.phase === Phase.Command) {
				this.missions[this.getPlayer()].startTurn(this.getState(), this.models.map(m => m.unitProfile));
				this.players[this.getPlayer()].primaryVP += this.scorePrimaryVP();
			}
			this.lastMovedModelId = undefined;
			this.models.forEach(model => model.updateAvailableToShoot(false));
		}
		if (order.action === BaseAction.NextPhase) {
			if (this.phase === phaseOrd.at(-1)) {
				this.turn++;
			}

			this.phase = phaseOrd[(this.phase + 1) % phaseOrd.length];
		}

		/*After*/

		if (order.action === BaseAction.NextPhase) {
			let nextPlayerId = this.getPlayer();
			if (this.phase === Phase.Movement) {
				this.models.forEach((model) => {
					if (model.playerId === nextPlayerId) {
						model.updateAvailableToMove(true);
					}
				});
			}

			if (this.phase === Phase.Shooting) {
				this.models.forEach((model) => {
					if (model.playerId === nextPlayerId) {
						model.updateAvailableToShoot(true);
					}
				});
			}

			return this.getState();
		}

		const model = this.models[order.id];

		if (order.action === BaseAction.Shoot) {
			if (this.lastShootedModelId !== undefined && this.lastShootedModelId !== order.id) {
				this.models[this.lastShootedModelId].updateAvailableToShoot(false);
			}
			this.lastShootedModelId = order.id;
		}

		if (order.action === BaseAction.Shoot && this.units[order.target] !== undefined) {
			this.models[this.lastShootedModelId].updateAvailableToShoot(false);
			const aliveTargets = this.units[order.target].models.filter(modelId => !this.models[modelId].dead);
			const targetModel = this.models[aliveTargets[aliveTargets.length - 1]];
			const damageValue = 100;
			if (targetModel !== undefined) {
				targetModel.inflictDamage(damageValue);
			}
		}

		if (order.action === BaseAction.Move && model !== undefined) {
			if (this.lastMovedModelId !== undefined && this.lastMovedModelId !== order.id) {
				this.models[this.lastMovedModelId].updateAvailableToMove(false);
			}
			this.lastMovedModelId = order.id;

			let vectorToMove = order.vector;
			if (order.expense > model.stamina) {
				vectorToMove = [0, 0];
			}
			model.decreaseStamina(order.expense);
			const newPosition = add(model.position, vectorToMove);
			const [x, y] = newPosition;

			if(0 <= x && x < this.battlefield.size[0] && 0 <= y && y < this.battlefield.size[1]) {
				const newPositionBusy = this.models.some(model => eq(model.position, newPosition));
				if (!newPositionBusy) {
					model.update(newPosition);
				}
			}
		}

		return this.getState();
	}

	getAvailableTarget(shooterId, weaponId, unitId) {
			const shooter = this.models[shooterId];
			const weapon = shooter.getRangedWeapon(weaponId);
			const aliveTargets = [];
			const availableTargets = [];
			this.units[unitId].models.forEach(modelId => {
				const possibleTarget = this.models[modelId];
				if (!possibleTarget.dead && weapon !== undefined) {
					if (len(sub(possibleTarget.position, shooter.position)) <= weapon.range) {
						availableTargets.push(possibleTarget.position);
					}
				}
			});
			return (new terrain[this.battlefield.terrain]).filterVisibleFrom(availableTargets, shooter.position);
		}

	getPlayer() { return this.turn % 2; }

	done() {
		const ids = this.models.filter(model => !model.dead).map(model => model.playerId);

		return this.turn > (this.totalRounds * 2) - 1;
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
			availableToShoot: this.models.filter(model => model.isAvailableToShoot()).map(model => model.id),
			misc: misc ?? {},
			battlefield: this.battlefield,
			turn: this.turn,
			round: Math.floor(this.turn / 2),
		};
	}
}
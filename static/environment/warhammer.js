import { mul, len, sub, add, eq, scaleToLen, round } from '../utils/vec2.js'
import { getRandomInteger } from '../utils/index.js';
import { MissionController, Mission } from './mission.js';
import { terrain } from '../battlefield/terrain.js';

const GameSequense = [
	'DeployArmies',
	'BeginTheBattle',
	'EndTheBattle',
]
export const Phase = {
	PreBattle: -1,
	Command: 0,
	Movement: 1,
	Reinforcements: 2,
	Shooting: 3,
}

const phaseOrd = [Phase.Command, Phase.Movement, Phase.Reinforcements, Phase.Shooting];

function d6() {
	return getRandomInteger(1, 7);
}

export const BaseAction = {
	NextPhase: 'NEXT_PHASE',
	Move: 'MOVE',
	Done: 'DONE',
	DiscardSecondary: 'DISCARD_SECONDARY',
	DeployModel: 'DEPLOY_MODEL',
	Shoot: 'SHOOT',
}

function parseProfile(value) {
	let damage = parseInt(value);
	if (!isNaN(damage)) {
		return damage;
	}

	const [diceCondition, tail] = value.split('+');
	return (diceResult) => {
		if(diceCondition === 'd3') {
			diceResult = Math.ceil(d6Result/3);
		}
		let tailValue = parseInt(tail);
		tailValue = isNaN(tailValue) ? 0 : tailValue
		return diceResult + tailValue;
	}
}

function onBattlefield(position) {
	return !isNaN(position[0]);
}

class Model {
	position = [NaN, NaN];
	deathPosition = [NaN, NaN];
	wounds = 0;
	dead = true;
	stamina = 0;
	scoutMove = 0;
	deployed = false;
	constructor(id, unit, position, profile, category = [], rules = [], rangedWeapons) {
		this.id = id;
		this.name = unit.name;
		this.playerId = unit.playerId;
		this.unitProfile = {
			"m": parseInt(profile.M),
			"t": parseInt(profile.T),
			"sv": parseInt(profile.SV),
			"w": parseInt(profile.W),
			"ld": parseInt(profile.LD),
			"oc": parseInt(profile.OC),
			"ranged_weapons": ["pulse_rifle"],
			"melee_weapons": ["close_combat_weapon_2"]
		};

		this.rangedWeapons = rangedWeapons.map((weaponProfile) => {
			return {
				"a": parseProfile(weaponProfile.A),
				"ap": parseInt(weaponProfile.AP),
				"bs": parseInt(weaponProfile.BS),
				"d": parseProfile(weaponProfile.D),
				"range": parseInt(weaponProfile.Range),
				"s": parseInt(weaponProfile.S),
				name: weaponProfile.name
			}
		});
		this.rangedWeaponLoaded = Array(rangedWeapons.length).fill(false);
		this.category = category;
		this.rules = rules;

		this.rules.forEach(rule => {
			if (rule.startsWith('scouts')) {
				this.scoutMove = parseInt('scouts 9"'.split(' ')[1]);
			}
		})
		this.stamina = this.scoutMove;
		this.position = position;
		this.dead = false;
		this.wounds = this.unitProfile.w;
		if(!isNaN(position[0])) {
			this.deployed = true;
		}
	}

	update(position) {
		if (!this.dead) {
			this.position = position;
		}
	}

	updateAvailableToScoutMove() {
		if (onBattlefield(this.position)) {
			this.stamina = this.scoutMove;
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
		this.deathPosition = [...this.position]
		this.position = [NaN, NaN];
	}

	decreaseStamina(value) {
		if (this.category.includes('aircraft')) {
			return;
		}
		this.stamina = Math.max(0, this.stamina - value);
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
	phase = Phase.PreBattle;
	turn = 0;
	started = false;
	objectiveControlReward = 5;
	totalRounds = 5;
	phaseSequence = 0;
	lastMovedModelId = null;
	constructor(config) {
		this.missions = [
			new MissionController('TakeAndHold', 'ChillingRain', [Mission.AreaDenial, Mission.StormHostileObjective]),
			new MissionController('TakeAndHold', 'ChillingRain', [Mission.EstablishLocus, Mission.Cleanse])
		]
		this.gameSettings = config.gameSettings;
		this.battlefields = config.battlefields;
		this.reset();
	}
	reset() {
		const battlefieldsNames = Object.keys(this.battlefields);
		this.battlefield = this.battlefields[battlefieldsNames[getRandomInteger(0, battlefieldsNames.length)]];

		this.phase = Phase.PreBattle;
		this.turn = 0
		this.phaseSequence = 0;
		let unitCounter = 0;

		const units = this.gameSettings.units.map(
			(playerUnits, playerId) => playerUnits.map(unit => {
				const result = ({...unit, playerId, id: unitCounter });
				unitCounter++;
				return result;
			})
		);
		this.players = [
			{ units: units[0], models: units[0].map(unit => unit.models).flat(), primaryVP: 0, secondaryVP: 0 },
			{ units: units[1], models: units[1].map(unit => unit.models).flat(), primaryVP: 0, secondaryVP: 0 }
		];
		this.units = units.flat();

		const usedPosition = [];
		this.models = this.units.map((unit, unitId) => {
			return unit.models.map(id => {
				if (this.gameSettings.models.length !== 0 && this.gameSettings.models[id] !== undefined && this.gameSettings.models[id] !== null) {
					return new Model(id, unit, this.gameSettings.models[id], this.gameSettings.modelProfiles[id], this.gameSettings.categories[unitId], this.gameSettings.rules[unitId], this.gameSettings.rangedWeapons[id]);
				}
				usedPosition.push(this.getRandomStartPosition(usedPosition));
				return new Model(id, unit, usedPosition.at(-1), this.gameSettings.modelProfiles[id], this.gameSettings.categories[unitId], this.gameSettings.rules[unitId], this.gameSettings.rangedWeapons[id]);
			});
		}).flat();

		this.missions.forEach(mission => {
			mission.reset();
			mission.updateSecondary(this.getRound());
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
		const round = this.getRound();
		if (order.action === BaseAction.Done) {
			this._done = true;
		}

		if (this.done()) {
			return this.getState();
		}
		const currentPlayerId = this.getPlayer();
		if (order.action === BaseAction.NextPhase) {
			if (this.phase === Phase.Command) {
				this.players[this.getPlayer()].primaryVP += this.scorePrimaryVP();
				this.players[currentPlayerId].primaryVP = Math.min(this.players[currentPlayerId].primaryVP, 50);
			}

			this.lastMovedModelId = null;
			this.models.forEach(model => model.updateAvailableToMove(false));
			this.models.forEach(model => model.updateAvailableToShoot(false));

			if (this.phase === phaseOrd.at(-1)) {
				this.scoreSecondary('scoreSecondaryVP');
			}
		}
		/*Before*/
		if (order.action === BaseAction.NextPhase) {
			if (this.phase === phaseOrd.at(-1)) {
				this.scoreSecondary('scoreEndTurnSecondary');
				this.turn++;
				this.missions[this.getPlayer()].startTurn(this.getState(), this.models.map(m => m.unitProfile));
			}

			if (this.phase !== Phase.PreBattle){
				this.phase = phaseOrd[(this.phase + 1) % phaseOrd.length];
			}

			if (this.phase === Phase.PreBattle) {
				this.phaseSequence++;

				if (this.phaseSequence === 2) {
					this.phase = Phase.Command;
					this.phaseSequence = 0;
					this.missions[this.getPlayer()].startTurn(this.getState(), this.models.map(m => m.unitProfile));
				}
			}
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
			if (this.phase === Phase.PreBattle) {
				this.models.forEach((model) => {
					if (model.playerId === nextPlayerId) {
						model.updateAvailableToScoutMove();
					}
				});
			}
			if (this.phase === Phase.Command) {
				this.missions[currentPlayerId].updateSecondary(this.getRound());
			}

			return this.getState();
		}

		const model = this.models[order.id];
		if (order.action === BaseAction.Shoot && this.units[order.target] !== undefined) {
			const shooter = this.models[order.id].position;
			const weapon = this.models[order.id].rangedWeapons[order.weaponId];
			const weaponLoaded = this.models[order.id].rangedWeaponLoaded[order.weaponId];

			const aliveTargets = [];
			const availableTargets = [];
			this.units[order.target].models.forEach(modelId => {
				if (!this.models[modelId].dead) {
					aliveTargets.push(this.models[modelId])
					if (len(sub(this.models[modelId].position, shooter)) <= weapon.range) {
						availableTargets.push(this.models[modelId].position);
					}
				}
			});
			const visibleTargets = (new terrain[this.battlefield.terrain]).filterVisibleFrom(availableTargets, shooter);
			if (weapon !== undefined && weaponLoaded && visibleTargets.length > 0) {
				this.models[order.id].rangedWeaponLoaded[order.weaponId] = false;
				const hits = order.hits;
				const wounds = [];
				const saves = [];
				const damages = [];
				for (let i = 0; i < hits.length; i++) {
					const hit = hits[i];
					if (hit < weapon.bs) {
						continue;
					}

					const targetModel = aliveTargets[aliveTargets.length - 1];

					if (targetModel === undefined) {
						break;
					}

					const targetToughness = targetModel.unitProfile.t;
					const targetSave = targetModel.unitProfile.sv;
					const woundDice = order.wounds[i];
					wounds.push(woundDice);

					if (woundDice < this.strenghtVsToughness(weapon.s, targetToughness)) {
						continue;
					}

					const saveDice = d6();
					saves.push(saveDice);
					if (saveDice >= (targetSave - weapon.ap)) {
						continue;
					}
					const damageValue = order.damages[i];
					targetModel.inflictDamage(damageValue);
					damages.push(damageValue);
				}

				this.scoreSecondary('scoreShootingSecondary');

				return this.getState({ hits, wounds, saves, damages });
			}
		}
		if (order.action === BaseAction.Move && model !== undefined) {
			if (this.lastMovedModelId !== null && this.lastMovedModelId !== order.id) {
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
				model.update(newPosition);
			}
		}
		if (order.action === BaseAction.DiscardSecondary) {
			this.missions[currentPlayerId].discardSecondary(order.id);
			this.missions[currentPlayerId].updateSecondary(round);
		}

		if (order.action === BaseAction.DeployModel) {
			this.models[order.id].update(order.position);
			this.models[order.id].deployed = true;
		}

		return this.getState();
	}

	scoreSecondary(type) {
		const currentPlayerId = this.getPlayer();
		this.players[currentPlayerId].secondaryVP += this.missions[currentPlayerId][type](this.getState(), this.models.map(m => m.unitProfile), this.models.map(m => m.category));
		this.players[currentPlayerId].secondaryVP = Math.min(this.players[currentPlayerId].secondaryVP, 40);
	}
	getPlayer() {
		if (this.phase === Phase.PreBattle) {
			return this.phaseSequence % 2;
		}
		return this.turn % 2;
	}

	done() {
		return this.turn > (this.totalRounds * 2) - 1;
	}

	end() {
		this.turn = (this.totalRounds * 2);
	}

	getRound() {
		return Math.floor(this.turn / 2);
	}

	strenghtVsToughness(s, t) {
		return [s >= t * 2, s > t, s === t, s < t && t < s * 2, s * 2 <= t].findIndex(v=> v) + 2;
	}
	scorePrimaryVP() {
		return this.missions[this.getPlayer()].scorePrimaryVP(this.getState());
	}

	getState(misc) {
		return {
			players: this.players,
			units: this.units,
			models: this.models.map(model => model.position),
			deadModels: this.models.map(model => model.deathPosition),
			dead: this.models.filter(model => model.dead).map(model => model.id),
			modelsWounds: this.models.map(model => model.wounds),
			modelsStamina: this.models.map(model => model.stamina),
			availableToShoot: this.models.filter(model => model.isAvailableToShoot()).map(model => model.id),
			phase: this.phase,
			player: this.getPlayer(),
			done: this.done(),
			misc: misc ?? {},
			battlefield: this.battlefield,
			turn: this.turn,
			round: Math.floor(this.turn / 2),
			secondaryMissions: this.missions.map(mission => mission.getSecondary()),
		};
	}
}
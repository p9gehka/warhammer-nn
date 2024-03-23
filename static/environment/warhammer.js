import { mul, len, sub, add, eq } from '../utils/vec2.js'
import { getRandomInteger } from '../utils/index.js';
import { MissionController, Mission } from './mission.js';

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
	const edge = [1,2,3,4,5,6].map(() => Math.random());
	return edge.findIndex((v) => v ===Math.max(...edge)) + 1;
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
		return diceResult + parseInt(tail);

	}
}

function onBattlefield(position) {
	return !isNaN(position[0]);
}

class Model {
	position = [NaN, NaN];
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
		if (onBattlefield(this.position)) {
			this.stamina = value ? this.unitProfile.m : 0;
		}
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
	objectiveControlReward = 5;
	totalRounds = 5;
	phaseSequence = 0;
	constructor(config) {
		this.gameSettings = config.gameSettings;
		this.battlefields = config.battlefields;
		this.missions = [
			new MissionController('TakeAndHold', 'ChillingRain', [Mission.Cleanse, Mission.InvestigateSignals]),
			new MissionController('TakeAndHold', 'ChillingRain', [Mission.DefendStronhold, Mission.ExtendBattleLines])
		]
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
				if (this.gameSettings.models.length !== 0 && this.gameSettings.models[id] !== undefined) {
					return new Model(id, unit, this.gameSettings.models[id], this.gameSettings.modelProfiles[id], this.gameSettings.categories[unitId], this.gameSettings.rules[unitId], this.gameSettings.rangedWeapons[id]);
				}
				usedPosition.push(this.getRandomStartPosition(usedPosition));
				return new Model(id, unit, usedPosition.at(-1), this.gameSettings.modelProfiles[id], this.gameSettings.categories[unitId], this.gameSettings.rules[unitId], this.gameSettings.rangedWeapons[id]);
			});
		}).flat();

		this.missions.forEach(mission => {
			mission.reset();
			mission.updateSecondary(this.getRound())
		});

		return this.getState();
	}
	getRandomStartPosition(exclude) {
		while(true) {
			let x1 = getRandomInteger(0, this.battlefield.size[0] - 1);
			let y1 = getRandomInteger(0, this.battlefield.size[1] - 1);
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
				this.players[currentPlayerId].primaryVP += this.missions[currentPlayerId].scorePrimaryVP(this.getState(), this.models.map(m => m.unitProfile));
				this.players[currentPlayerId].primaryVP = Math.min(this.players[currentPlayerId].primaryVP, 50);
			}

			this.models.forEach(model => model.updateAvailableToMove(false));

			if (this.phase === phaseOrd.at(-1)) {
				this.players[currentPlayerId].secondaryVP += this.missions[currentPlayerId].scoreSecondaryVP(this.getState(), this.models.map(m => m.unitProfile), this.models.map(m => m.category));
				this.players[currentPlayerId].secondaryVP = Math.min(this.players[currentPlayerId].secondaryVP, 40);
			}

		}
		/*Before*/
		if (order.action === BaseAction.NextPhase) {
			if (this.phase === phaseOrd.at(-1)) {
				this.turn++;
			}

			if (this.phase !== Phase.PreBattle){
				this.phase = phaseOrd[(this.phase + 1) % phaseOrd.length];
			}

			if (this.phase === Phase.PreBattle) {
				this.phaseSequence++;

				if (this.phaseSequence === 2) {
					this.phase = Phase.Command;
					this.phaseSequence = 0;
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
			const weapon = this.models[order.id].rangedWeapons[order.weaponId];
			if (weapon !== undefined) {
				const hits = Array(weapon.a).fill(0).map(d6);
				const wounds = [];
				const saves = [];
				const damage = [];
				for (let hit of hits) {
					if (hit < weapon.bs) {
						continue;
					}

					const aliveTargetModel = this.units[order.target].models.filter(modelId => !this.models[modelId].dead);
					const targetModelId = aliveTargetModel[aliveTargetModel.length - 1];
					const targetModel = this.models[targetModelId];

					if (targetModel === undefined) {
						break;
					}

					const targetToughness = targetModel.unitProfile.t;
					const targetSave = targetModel.unitProfile.sv;
					const woundDice = d6();
					wounds.push(woundDice);

					if (woundDice < this.strenghtVsToughness(weapon.s, targetToughness)) {
						continue;
					}

					const saveDice = d6();
					saves.push(saveDice);
					if (saveDice >= (targetSave - weapon.ap)) {
						continue
					}
					const damageValue = Number.isInteger(weapon.d) ? weapon.d : weapon.d(d6());
					targetModel.inflictDamage(damageValue);
					damage.push(damageValue);
				}
				return this.getState({ hits, wounds, saves, damage });
			}
		}
		if (order.action === BaseAction.Move) {
			if (len(order.vector) > model.stamina) {
				return this.getState();
			}

			model.decreaseStamina(order.expense)

			const newPosition = add(model.position, order.vector);
			model.update(newPosition);

			this.models.forEach(model => {
				const [x, y] = model.position;
				if (x < 0 || this.battlefield.size[0] <= x || y < 0 || this.battlefield.size[1] <= y) {
					model.kill();
				}
			});
		}
		if (order.action === BaseAction.DiscardSecondary) {
			this.missions[currentPlayerId].discardSecondary(order.id);
			this.missions[currentPlayerId].updateSecondary(round);
		}

		if (order.action === BaseAction.DeployModel && (round === 1 || round === 2)) {
			this.models[order.id].update(order.position);
			this.models[order.id].deployed = true;
		}

		return this.getState();
	}

	getPlayer() {
		if (this.phase === Phase.PreBattle) {
			return this.phaseSequence % 2;
		}
		return this.turn % 2;
	}

	done() {
		const ids = this.models.filter(model => !model.dead).map(model => model.playerId);

		return this.turn > (this.totalRounds * 2) - 1 || new Set(ids).size === 1;
	}

	end() {
		this.turn = (this.totalRounds * 2);
	}
	getRound() {
		return Math.floor(this.turn / 2)
	}

	strenghtVsToughness(s, t) {
		return [s >= t * 2, s > t, s === t, s < t && t < s * 2, s * 2 <= t].findIndex(v=> v) + 2;
	}

	getState(misc) {
		return {
			players: this.players,
			units: this.units,
			models: this.models.map(model => model.position),
			modelsWounds: this.models.map(model => model.wounds),
			phase: this.phase,
			player: this.getPlayer(),
			done: this.done(),
			modelsStamina: this.models.map(model => model.stamina),
			misc: misc ?? {},
			battlefield: this.battlefield,
			turn: this.turn,
			round: Math.floor(this.turn / 2),
			secondaryMissions: this.missions.map(mission => mission.getSecondary()),
			tamptingTarget: this.missions.map(mission => mission.tamptingTarget)
		};
	}
}
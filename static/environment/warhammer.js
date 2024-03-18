import { mul, len, sub, add, eq } from '../utils/vec2.js'
import { getRandomInteger } from '../utils/index.js';
import { MissionController, Mission } from './mission.js';

const GameSequense = [
	'DeployArmies',
	'BeginTheBattle',
	'EndTheBattle',
]
export const Phase = {
	Command: 0,
	Movement: 1,
	Reinforcements: 2,
}

const phaseOrd = [Phase.Command, Phase.Movement, Phase.Reinforcements];

export const BaseAction = {
	NextPhase: 'NEXT_PHASE',
	Move: 'MOVE',
	Done: 'DONE',
	DiscardSecondary: 'DISCARD_SECONDARY',
	DeployModel: 'DEPLOY_MODEL'
}

class Model {
	position = [NaN, NaN];
	wound = 0;
	dead = true;
	stamina = 0;
	deployed = false;
	constructor(id, unit, position, profile, category = []) {
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
		this.category = category;

		if (position !== null) {
			this.position = position;
			this.dead = false;
			this.wound = this.unitProfile.w;
			if(!isNaN(position[0])) {
				this.deployed = true;
			}
		}
	}

	update(position) {
		if (!this.dead) {
			this.position = position;
		}
	}

	updateAvailableToMove(value) {
		if (!this.dead) {
			this.stamina = value ? this.unitProfile.m : 0;
		}
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

	decreaseStamina(value) {
		if (this.category.includes('aircraft')) {
			return;
		}
		this.stamina = Math.max(0, this.stamina - value);
	}
}


export class Warhammer {
	players = [];
	units = [];
	models = [];
	phase = Phase.Command;
	turn = 0;
	objectiveControlReward = 5;
	totalRounds = 5;
	constructor(config) {
		this.gameSettings = config.gameSettings;
		this.battlefields = config.battlefields;
		this.mission = new MissionController('TakeAndHold', 'ChillingRain', [Mission.DefendStronhold, Mission.ExtendBattleLines]);
		this.reset();
	}
	reset() {
		const battlefieldsNames = Object.keys(this.battlefields);
		this.battlefield = this.battlefields[battlefieldsNames[getRandomInteger(0, battlefieldsNames.length)]];

		this.phase = Phase.Command;
		this.turn = 0

		const units = this.gameSettings.units.map(
			(playerUnits, playerId) => playerUnits.map(unit => ({...unit, playerId }))
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
					return new Model(id, unit, this.gameSettings.models[id], this.gameSettings.profiles[unitId], this.gameSettings.categories[unitId]);
				}
				usedPosition.push(this.getRandomStartPosition(usedPosition));
				return new Model(id, unit, usedPosition.at(-1), this.gameSettings.profile[id]);
			});
		}).flat();

		this.models.forEach(model => {
			if (model.playerId === this.getPlayer()) {
				model.updateAvailableToMove(true);
			}
		});

		this.mission.reset();
		this.mission.updateSecondary(this.getRound())

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
				this.players[currentPlayerId].primaryVP += this.mission.scorePrimaryVP(this.getState(), this.models.map(m => m.unitProfile));
				this.players[currentPlayerId].primaryVP = Math.min(this.players[currentPlayerId].primaryVP, 50);
			}

			this.models.forEach(model => model.updateAvailableToMove(false));

			if (this.phase === phaseOrd.at(-1)) {
				this.players[currentPlayerId].secondaryVP += this.mission.scoreSecondaryVP(this.getState(), this.models.map(m => m.unitProfile), this.models.map(m => m.category));
				this.players[currentPlayerId].secondaryVP = Math.min(this.players[currentPlayerId].secondaryVP, 40);
			}
		}
		/*Before*/
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

			if (this.phase === Phase.Command) {
				this.mission.updateSecondary(this.getRound());
			}
			return this.getState();
		}

		const model = this.models[order.id];

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
			this.mission.discardSecondary(order.id);
			this.mission.updateSecondary(round);
		}

		if (order.action === BaseAction.DeployModel && (round === 1 || round === 2)) {
			this.models[order.id].update(order.position);
			this.models[order.id].deployed = true;
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
	getRound() {
		return Math.floor(this.turn / 2)
	}
	getState(misc) {
		return {
			players: this.players,
			units: this.units,
			models: this.models.map(model => !model.dead ? model.position : null),
			phase: this.phase,
			player: this.getPlayer(),
			done: this.done(),
			modelsStamina: this.models.map(model => model.stamina),
			misc: misc ?? {},
			battlefield: this.battlefield,
			turn: this.turn,
			round: Math.floor(this.turn / 2),
			secondaryMissions: this.mission.getSecondary(),
			tamptingTarget: this.mission.tamptingTarget
		};
	}
}
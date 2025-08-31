import { len, sub } from '../utils/vec2.js';
import { getRandomInteger } from '../utils/index.js';
import { deployment } from '../battlefield/deployment.js';
import { Mission, missionMap} from './mission-map.js';

export { Mission } from './mission-map.js';

export class MissionController {
	fixedMission = [
		Mission.BehindEnemyLines, Mission.Cleanse, Mission.EstablishLocus, Mission.EngageOnAllFronts,
		Mission.Assassination, Mission.BringItDown, Mission.StormHostileObjective, Mission.CullTheHorde
	]

	tacticalMissions = [
		Mission.DefendStronhold, Mission.SecureNoMansLand, Mission.AreaDenial,
		Mission.NoPrisoners, Mission.OverwhelmingForce, Mission.RecoverAssets, Mission.Containment,
		Mission.ExtendBattleLines, Mission.MarketForDeath, Mission.Sabotage
	]
	allSecondary = [...this.fixedMission, ...this.tacticalMissions];
	deadModels = [];
	_deck = [];
	opponentUnitDeathAtRound = [[],[],[],[],[]];
	secondariesVPByRound = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
	startTurnObjectiveControl = [];
	constructor(primary, missionRule, secondary) {
		this.primary = primary;
		this.missionRule = missionRule;
		this.secondary = secondary;
		this.isTactical = this.tacticalMissions.includes(secondary[0]);
	}

	reset() {
		if (this.isTactical) {
			this.secondary = [];
			this._deck = [];
			this._deck.push(...this.allSecondary);
		}

		this.secondariesVPByRound = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
		this.opponentUnitDeathAtRound = [[],[],[],[],[]];
		this.deadModels = [];
		this.startTurnObjectiveControl = [];
	}
	updateSecondary(round) {
		if(!this.isTactical) {
			return;
		}

		while(this.secondary.length < 2 && this._deck.length > 0) {
			const card = getRandomInteger(0, this._deck.length);
			const mission = this._deck[card];
			if (round === 0 && (mission === Mission.DefendStronhold || mission === Mission.StormHostileObjective)) {
				continue;
			} 
			this.secondary.push(mission);
			this._deck.splice(card, 1);
		}
	}

	startTurn(state, profiles) {
		const activePlayerId = state.player;
		const battlefield = state.battlefield;

		const deploy = new deployment[battlefield.deployment];
		const objectiveMarkers = deploy.objective_markers;
		const objectiveControl = Array(objectiveMarkers.length).fill(0);
		state.players.forEach((player, modelPlayerId) => {
			player.models.forEach(modelId => {
				objectiveMarkers.forEach((markerPosition, i) => {
					const modelPosition = state.models[modelId];
					if (len(sub(modelPosition, markerPosition)) <= deploy.objective_marker_control_distance) {
						const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
						const oc = profiles[modelId].oc * ocSign;
						objectiveControl[i] += oc;
					}
				});
			});
		});

		this.startTurnObjectiveControl = objectiveControl
	}
	scorePrimaryVP(state, profiles) {
		const turn = state.turn;
		const round = Math.floor(turn / 2);
		const objectiveControlReward = 5;

		if (round < 1) {
			return 0;
		}
		return Math.min(this.startTurnObjectiveControl.filter(oc => oc > 0).length * objectiveControlReward, 15);
	}
	scoreSecondaryVP(state, profiles, categories) {
		let secondaryVP = 0;
		const activePlayerId = state.player;
		const opponentPlayer = (state.player + 1) % 2;
		const battlefield = state.battlefield;
		const playerDeployment = new deployment[battlefield.deployment];
		const completed = [];

		this.secondary.forEach(key => {
			const { completed: missionCompleted, secondaryVP: missionSecondaryVP } = missionMap[key].scoreSecondaryVP(state, profiles, categories);
			secondaryVP += missionSecondaryVP;
			if (missionCompleted) {
				completed.push(key);
			}
		});

		if (this.isTactical) {
			this.secondary = this.secondary.filter(mission => !completed.includes(mission));
		}
		return secondaryVP;
	}
	scoreShootingSecondary(state, profiles, categories) {
		const killedModels = state.dead.filter(id => !this.deadModels.includes(id));
		const round = Math.floor(state.turn / 2);

		const opponentPlayer = (state.player + 1) % 2;
		let secondaryVP = 0;
		const completed = [];
		let opponentUnitDeathAtRound = [];
		if (this.secondary.includes(Mission.NoPrisoners) || this.secondary.includes(Mission.OverwhelmingForce)
			|| this.secondary.includes(Mission.BringItDown)) {
			opponentUnitDeathAtRound = state.players[opponentPlayer].units.filter(unit => {
				return unit.models.every(modelId => this.deadModels.includes(modelId) || killedModels.includes(modelId))
					&& unit.models.some(modelId => killedModels.includes(modelId));
			});
			this.opponentUnitDeathAtRound[round].push(...opponentUnitDeathAtRound);
		}

		if (this.secondary.includes(Mission.OverwhelmingForce)) {
			const deploy = new deployment[state.battlefield.deployment];
			const objectiveMarkers = deploy.objective_markers;
			const indexOfMission = this.secondary.indexOf(Mission.OverwhelmingForce);
			const points = opponentUnitDeathAtRound.filter(unit => {
				return unit.models.some(modelId => {
					return killedModels.includes(modelId)
						&& objectiveMarkers.some(markerPosition => {
							return len(sub(state.deadModels[modelId], markerPosition)) <= deploy.objective_marker_control_distance;
						});
				});
			}).length * 3;

			const totalVPByRound = this.secondariesVPByRound[round][indexOfMission];
			const vpByThisIteration = Math.min((5 - totalVPByRound), points);
			this.secondariesVPByRound[round][indexOfMission] += vpByThisIteration;

			secondaryVP += vpByThisIteration;
		}
		if (this.secondary.includes(Mission.Assassination)) {
			const killedCharacter = killedModels.filter(modelId => categories[modelId].includes('character'));
			if (!this.isTactical) {
				secondaryVP += killedCharacter.length * 4;
			} else if(killedCharacter.length > 0) {
				secondaryVP += 5;
				completed.push(Mission.Assassination);
			}
		}


		if (this.secondary.includes(Mission.BringItDown)) {
			let points = 0;
			const indexOfMission = this.secondary.indexOf(Mission.BringItDown);

			opponentUnitDeathAtRound.forEach(unit => {
				if(unit.models.some(modelId => categories[modelId].includes('monster') || categories[modelId].includes('vehicle'))) {
					points += 2;

					const totalWounds = unit.models.reduce((acc, modelId) => acc + profiles[modelId].w,0)
					if (totalWounds >= 15) {
						points += 2;
					}

					if (totalWounds >= 15) {
						points += 2;
					}
				}
			})

			this.secondariesVPByRound[round][indexOfMission] += points;

			secondaryVP += points;
		}

		this.deadModels = [...state.dead];
		if (this.isTactical) {
			this.secondary = this.secondary.filter(mission => !completed.includes(mission));
		}
		return secondaryVP;
	}

	scoreEndTurnSecondary(state, profiles, categories) {
		const opponentPlayer = (state.player + 1) % 2;
		let secondaryVP = 0;
		const completed = [];
		const round = Math.floor(state.turn / 2);

		const activePlayerId = state.player;
		const battlefield = state.battlefield;

		if (this.secondary.includes(Mission.Assassination)) {
			if (this.isTactical &&
				state.players[opponentPlayer].models
					.filter(id => categories[id].includes('character'))
					.every(id => state.dead.includes(id))
			) {
				secondaryVP += 5;
				completed.push(Mission.Assassination);
			}
		}

		if (this.secondary.includes(Mission.StormHostileObjective)) {
			const deploy = new deployment[battlefield.deployment];
			const objectiveMarkers = deploy.objective_markers;
			const endTurnObjectiveControl = Array(objectiveMarkers.length).fill(0);
			state.players.forEach((player, modelPlayerId) => {
				player.models.forEach(modelId => {
					objectiveMarkers.forEach((markerPosition, i) => {
						const modelPosition = state.models[modelId];
						if (len(sub(modelPosition, markerPosition)) <= deploy.objective_marker_control_distance) {
							const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
							const oc = profiles[modelId].oc * ocSign;
							endTurnObjectiveControl[i] += oc;
						}
					});
				});
			});
			const opponentHadObjectiveMarker = this.startTurnObjectiveControl.some(objectControl => objectControl < 0);
			const missionCompleted = this.startTurnObjectiveControl.some((prevObjectControl, i) => {
				const currentObjectControl = endTurnObjectiveControl[i];
				return (opponentHadObjectiveMarker ? prevObjectControl < 0 : prevObjectControl === 0) && 0 < currentObjectControl;
			});
			if (missionCompleted) {
				secondaryVP += 4;
				completed.push(Mission.StormHostileObjective);
			}
		}

		if (this.secondary.includes(Mission.NoPrisoners) && this.opponentUnitDeathAtRound[round].length > 0) {
			secondaryVP += Math.min(5, this.opponentUnitDeathAtRound[round].length * 2);
			completed.push(Mission.NoPrisoners);
		}

		if (this.secondary.includes(Mission.BringItDown) && this.secondariesVPByRound[round][this.secondary.indexOf(Mission.BringItDown)] > 0) {
			completed.push(Mission.BringItDown);
		}

		if (this.secondary.includes(Mission.OverwhelmingForce) && this.secondariesVPByRound[round][this.secondary.indexOf(Mission.OverwhelmingForce)] > 0) {
			completed.push(Mission.OverwhelmingForce);
		}


		if (this.isTactical) {
			this.secondary = this.secondary.filter(mission => !completed.includes(mission));
		}

		return secondaryVP;
	}

	getSecondary() {
		return this.secondary;
	}

	discardSecondary(id) {
		this.secondary.splice(id, 1);
	}
}

import { len, sub } from '../utils/vec2.js';
import { deployment } from '../battlefield/deployment.js';
import { Rect } from '../utils/planimatrics/rect.js';
import { Circle } from '../utils/planimatrics/circle.js';
import { getRandomInteger } from '../utils/index.js';

export const Mission = {
	BehindEnemyLines: 'BehindEnemyLines',
	EngageOnAllFronts: 'EngageOnAllFronts',
	Cleanse: 'Cleanse',
	EstablishLocus: 'EstablishLocus',
	DefendStronhold: 'DefendStronhold',
	SecureNoMansLand: 'SecureNoMansLand',
	ExtendBattleLines: 'ExtendBattleLines',
	Assassination: 'Assassination',
	NoPrisoners: 'NoPrisoners',
	OverwhelmingForce: 'OverwhelmingForce',
	StormHostileObjective: 'StormHostileObjective',
	BringItDown: 'BringItDown',
	AreaDenial: 'AreaDenial',

	RecoverAssets: 'RecoverAssets',
	CullTheHorde: 'CullTheHorde',
	Containment: 'Containment',
	MarketForDeath: 'MarkedForDeath',
	Sabotage: 'Sabotage'
}

const size = [60, 44];
const center = [30, 22];

function onBattlefield(position) {
	return !isNaN(position[0]);
}
export class MissionController {
	fixedMission = [
		Mission.BehindEnemyLines, Mission.Cleanse, Mission.EstablishLocus, Mission.EngageOnAllFronts,
		Mission.Assassination, Mission.BringItDown, Mission.StormHostileObjective, Mission.CullTheHorde
	]

	tacticalMissions = [
		Mission.DefendStronhold, Mission.SecureNoMansLand, Mission.AreaDenial, Mission.ATamptingTarget,
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
		const battlefield = state.battlefield;
		const activePlayerId = state.player;
		const opponentPlayer = (state.player + 1) % 2;
		const playerDeployment = new deployment[battlefield.deployment];
		const completed = [];
		if (this.secondary.includes(Mission.BehindEnemyLines)) {
			const hollyWithinCounter = state.players[state.player].units.filter(unit => {
				const modelsOnBattlefield = unit.models.filter(modelId => onBattlefield(state.models[modelId]));
				return modelsOnBattlefield.length > 0 && modelsOnBattlefield.every(modelId => playerDeployment.include(opponentPlayer, state.models[modelId]) && !categories[modelId].includes('aircraft'));
			}).length;

			if (hollyWithinCounter >= 2) {
				secondaryVP += 1;
			}
			if(hollyWithinCounter > 0) {
				secondaryVP += 3;
				completed.push(Mission.BehindEnemyLines);
			}
		}
		if (this.secondary.includes(Mission.EngageOnAllFronts)) {
			const quatres = [new Rect(0, 0, 30, 22), new Rect(0, 25, 30, 22), new Rect(33, 0, 30, 22), new Rect(33, 25, 30, 22)];
			const centerCircle = [new Circle(...center, 6)]
			let quatrCounters = [0, 0, 0, 0];

			state.players[state.player].units.forEach(unit => {
				const modelsOnBattlefield = unit.models.filter(modelId => onBattlefield(state.models[modelId]));
				if(modelsOnBattlefield.length === 0) {
					return;
				}
				quatres.forEach((quatr, i) => {
					if(modelsOnBattlefield.every(modelId =>
						quatr.include(...state.models[modelId]) && !centerCircle.includes(...state.models[modelId])
					)) {
						quatrCounters[i]++;
					}
				});
			});

			const totalQuatres = quatrCounters.filter(v => v !== 0).length;
			if (totalQuatres === 4) {
				secondaryVP += 2;
			}
			if(totalQuatres >= 3) {
				secondaryVP += 2;
				completed.push(Mission.EngageOnAllFronts);
			}
		}

		if (this.secondary.includes(Mission.Cleanse)) {
			const cleanseMarkers = [playerDeployment.deploy_markers[opponentPlayer], ...playerDeployment.nomansland_markers];
			const objectiveControl = Array(cleanseMarkers.length).fill(0);
			state.players.forEach((player, modelPlayerId) => {
				player.models.forEach(modelId => {
					cleanseMarkers.forEach((markerPosition, i) => {
						const modelPosition = state.models[modelId];
						if (len(sub(modelPosition, markerPosition)) <= playerDeployment.objective_marker_control_distance) {
							const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
							const oc = profiles[modelId].oc * ocSign;
							objectiveControl[i] += oc;
						}
					});
				})
			});
			const cleanedMarkersCount = objectiveControl.filter(oc => oc > 0).length;
			if (cleanedMarkersCount >= 2) {
				secondaryVP += 2;
			}
			if(cleanedMarkersCount >= 1) {
				secondaryVP += 2;
				completed.push(Mission.Cleanse);
			}
		}

		if (this.secondary.includes(Mission.EstablishLocus)) {
			let center6Circle = new Circle(...center, 6);
			let inOpponentDeploy = false;
			let inCenter = false;

			for (let modelId of state.players[state.player].models) {
				if (playerDeployment.include(opponentPlayer, state.models[modelId])) {
					inOpponentDeploy = true;
					continue;
				} else if (center6Circle.include(...state.models[modelId])) {
					inCenter = true;
				}
			}

			if (inOpponentDeploy) {
				secondaryVP += 2;
			} 

			if (inCenter || inOpponentDeploy) {
				secondaryVP += 2;
				completed.push(Mission.EstablishLocus);
			}
		}

		if (this.secondary.includes(Mission.SecureNoMansLand)) {
			const objectiveControl = Array(playerDeployment.nomansland_markers.length).fill(0);
			state.players.forEach((player, modelPlayerId) => {
				player.models.forEach(modelId => {
					playerDeployment.nomansland_markers.forEach((markerPosition, i) => {
						const modelPosition = state.models[modelId];
						if (len(sub(modelPosition, markerPosition)) <= playerDeployment.objective_marker_control_distance) {
							const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
							const oc = profiles[modelId].oc * ocSign;
							objectiveControl[i] += oc;
						}
					});
				})
			});
			const securedNoMansCount = objectiveControl.filter(oc => oc > 0).length;
			if (securedNoMansCount >= 2) {
				secondaryVP += 3;
			}
			if(securedNoMansCount >= 1) {
				secondaryVP += 2;
				completed.push(Mission.SecureNoMansLand);
			}
		}

		if (this.secondary.includes(Mission.AreaDenial)) {
			let center6Circle = new Circle(...center, 6);
			let center3Circle = new Circle(...center, 3);
			let in3Center = false;
			let opponent6Center = false;
			let opponent3Center = false;

			for(let unit of state.players[state.player].units) {
				const modelsOnBattlefield = unit.models.filter(modelId => onBattlefield(state.models[modelId]));
				in3Center = modelsOnBattlefield.length > 0 && modelsOnBattlefield.some(modelId => center3Circle.include(...state.models[modelId]));
				if (in3Center) {
					break;
				}
			}

			for(let unit of state.players[opponentPlayer].units) {
				const modelsOnBattlefield = unit.models.filter(modelId => onBattlefield(state.models[modelId]));
				if (!opponent6Center) {
					opponent6Center = modelsOnBattlefield.length > 0 && modelsOnBattlefield.some(modelId => center6Circle.include(...state.models[modelId]));
				}
				opponent3Center = modelsOnBattlefield.length > 0 && modelsOnBattlefield.some(modelId => center3Circle.include(...state.models[modelId]));
				if (opponent3Center)  {
					break;
				}
			}

			if (in3Center && !opponent3Center) {
				secondaryVP += 2;
			}

			if (in3Center && !opponent6Center) {
				secondaryVP += 3;
			}
		}

		if (this.secondary.includes(Mission.DefendStronhold)) {
			const ownDelploymentMarker = playerDeployment.deploy_markers[activePlayerId];
			let markerControl = 0;
			state.players.forEach((player, modelPlayerId) => {
				player.models.forEach(modelId => {
					const modelPosition = state.models[modelId];
					if (len(sub(modelPosition, ownDelploymentMarker)) <= playerDeployment.objective_marker_control_distance) {
						const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
						const oc = profiles[modelId].oc * ocSign;
						markerControl += oc;
					}
				})
			});

			if (markerControl > 0) {
				secondaryVP += 3;
				completed.push(Mission.DefendStronhold);
			}
		}

		if (this.secondary.includes(Mission.ExtendBattleLines)) {
			const objectiveControl = Array(playerDeployment.nomansland_markers.length).fill(0);
			state.players.forEach((player, modelPlayerId) => {
				player.models.forEach(modelId => {
					playerDeployment.nomansland_markers.forEach((markerPosition, i) => {
						const modelPosition = state.models[modelId];
						if (len(sub(modelPosition, markerPosition)) <= playerDeployment.objective_marker_control_distance) {
							const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
							const oc = profiles[modelId].oc * ocSign;
							objectiveControl[i] += oc;
						}
					});
				})
			});
			const markerControlCounter = objectiveControl.filter(oc => oc > 0).length;
			if (markerControlCounter >= 2) {
				secondaryVP += 3;
			}
			if(markerControlCounter >= 1) {
				secondaryVP += 2;
				completed.push(Mission.ExtendBattleLines);
			}
		}

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

			this.secondariesVPByRound[round][indexOfMission] += point;

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

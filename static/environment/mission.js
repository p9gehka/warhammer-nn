import { len, sub } from '../utils/vec2.js';
import { deployment } from '../battlefield/deployment.js';
import { Rect } from '../utils/planimatrics/rect.js';
import { Circle } from '../utils/planimatrics/circle.js';
import { getRandomInteger } from '../utils/index.js';

export const Mission = {
	BehindEnemyLines: 'BehindEnemyLines',
	EngageOnAllFronts: 'EngageOnAllFronts',
	Cleanse: 'Cleanse',
	DeployTeleportHomer: 'DeployTeleportHomer',
	InvestigateSignals: 'InvestigateSignals',
	DefendStronhold: 'DefendStronhold',
	SecureNoMansLand: 'SecureNoMansLand',
	AreaDenial: 'AreaDenial',
	CaptureEnemyOutpost: 'CaptureEnemyOutpost',
	ATamptingTarget: 'ATamptingTarget',
	ExtendBattleLines: 'ExtendBattleLines',
	Assasination: 'Assasination',
	NoPrisoners: 'NoPrisoners',
	BringItDown: 'BringItDown',
	OverwhelmingForce: 'OverwhelmingForce',
	StormHostileObjective: 'StormHostileObjective',
}

const size = [60, 44];
const center = [30, 22];

export class MissionController {
	fixedMission = [
		Mission.BehindEnemyLines, Mission.Cleanse, Mission.DeployTeleportHomer, Mission.EngageOnAllFronts,
		Mission.InvestigateSignals, Mission.Assasination, Mission.BringItDown, Mission.StormHostileObjective,
	]

	tacticalMissions = [
		Mission.DefendStronhold, Mission.SecureNoMansLand, Mission.AreaDenial, Mission.ATamptingTarget,
		Mission.CaptureEnemyOutpost, Mission.NoPrisoners, Mission.OverwhelmingForce,
	]
	allSecondary = [...this.fixedMission, ...this.tacticalMissions];
	_deck = [];

	constructor(primary, missionRule, secondary) {
		this.primary = primary;
		this.missionRule = missionRule;
		this.secondary = secondary;
		this.tamptingTarget = getRandomInteger(0, 2);
		this.isTactical = this.tacticalMissions.includes(secondary[0]);
	}
	reset() {
		this.tamptingTarget = getRandomInteger(0, 2);
		this.secondary = [];
		this._deck = [];
		this._deck.push(...this.allSecondary);
		console.log('reset')
		console.log({ deck: [...this._deck], secondary: [...this.secondary] });
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
			console.log('add', mission);
			console.log({ round, deck: [...this._deck], secondary: [...this.secondary], card });
		}
	}

	scorePrimaryVP(state, profiles) {
		const turn = state.turn;
		const models = state.models;
		const activePlayerId = state.player;
		const battlefield = state.battlefield;
		const round = Math.floor(turn / 2);
		const objectiveControlReward = 5;

		if (round < 1) {
			return 0;
		}
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
			})
		});

		return Math.min(objectiveControl.filter(oc => oc > 0).length * objectiveControlReward, 15);
	}
	scoreSecondaryVP(state, profiles) {
		let secondaryVP = 0;
		const battlefield = state.battlefield;
		const activePlayerId = state.player
		const opponentPlayer = (state.player + 1) % 2
		const playerDeployment = new deployment[battlefield.deployment];
		const completed = [];
		if (this.secondary.includes(Mission.BehindEnemyLines)) {
			const hollyWithinCounter = state.players[state.player].models
				.filter((modelId) => playerDeployment.include(opponentPlayer, state.models[modelId])).length;

			if (hollyWithinCounter >= 2) {
				secondaryVP += this.isTactical ? 2 : 1;
			}
			if(hollyWithinCounter > 0) {
				secondaryVP += 3;
				completed.push(Mission.BehindEnemyLines);
			}
		}
		if (this.secondary.includes(Mission.EngageOnAllFronts)) {
			const quatres = [new Rect(0, 0, 27, 19), new Rect(0, 25, 27, 19), new Rect(33, 0, 27, 19), new Rect(33, 25, 27, 19)];
			let quatrCounters = [0, 0, 0, 0];
			state.players[state.player].models.forEach((modelId) =>{
				quatres.forEach((quatr, i) => {
					if(quatr.include(...state.models[modelId])) {
						quatrCounters[i]++;
					}
				});
			});
			const totalQuatres = quatrCounters.filter(v => v !== 0).length;
			if (totalQuatres === 4) {
				secondaryVP += 2;
			}
			if(totalQuatres >= 3) {
				secondaryVP += this.isTactical ? 3 : 2;
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
				secondaryVP += this.isTactical ? 3 : 2;
				completed.push(Mission.Cleanse);
			}
		}

		if (this.secondary.includes(Mission.DeployTeleportHomer)) {
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
				secondaryVP += this.isTactical ? 2 : 1;
			} 

			if (inCenter || inOpponentDeploy) {
				secondaryVP += 3;
				completed.push(Mission.DeployTeleportHomer);
			}
		}

		if (this.secondary.includes(Mission.InvestigateSignals)) {
			const angle9Circles = [[0, 0], [60, 0], [60, 40], [0, 40]].map(angle => new Circle(...angle, 9));
			let angleCounters = [0, 0, 0, 0];
			for (let modelId of state.players[state.player].models) {
				 angle9Circles.forEach((circle, i)=> {
				 	if (circle.include(...state.models[modelId])) {
				 		angleCounters[i]++;
				 	}
				 })
			}
			let totalAngles = angleCounters.filter(counter => counter > 0).length;
			secondaryVP += totalAngles * 2;
			if (totalAngles > 0) {
				completed.push(Mission.InvestigateSignals);
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
			let inCenter = false;

			for (let modelId of state.players[state.player].models) {
				if (center6Circle.include(...state.models[modelId])) {
					inCenter = true;
					continue;
				}
			}

			if (inCenter) {
				secondaryVP += 5;
				completed.push(Mission.AreaDenial);
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

		if (this.secondary.includes(Mission.CaptureEnemyOutpost)) {
			const opponentMarker = playerDeployment.deploy_markers[opponentPlayer];
			let markerControl = 0;
			state.players.forEach((player, modelPlayerId) => {
				player.models.forEach(modelId => {
					const modelPosition = state.models[modelId];
					if (len(sub(modelPosition, opponentMarker)) <= playerDeployment.objective_marker_control_distance) {
						const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
						const oc = profiles[modelId].oc * ocSign;
						markerControl += oc;
					}
				})
			});

			if (markerControl > 0) {
				secondaryVP += 8;
				completed.push(Mission.CaptureEnemyOutpost);
			}
		}

		if (this.secondary.includes(Mission.ATamptingTarget)) {
			const targetMarker = playerDeployment.nomansland_markers[this.tamptingTarget];
			let markerControl = 0;
			state.players.forEach((player, modelPlayerId) => {
				player.models.forEach(modelId => {
					const modelPosition = state.models[modelId];
					if (len(sub(modelPosition, targetMarker)) <= playerDeployment.objective_marker_control_distance) {
						const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
						const oc = profiles[modelId].oc * ocSign;
						markerControl += oc;
					}
				})
			});

			if (markerControl > 0) {
				secondaryVP += 5;
				completed.push(Mission.ATamptingTarget);
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

		this.secondary = this.secondary.filter(mission => !completed.includes(mission));
		console.log('completed', completed);
		console.log({ deck: [...this._deck], secondary: [...this.secondary] });
		return secondaryVP;
	}
	getSecondary() {
		return this.secondary;
	}

	discardSecondary(id) {
		console.log('discard', this.secondary[id]);
		this.secondary.splice(id, 1);
	}
}

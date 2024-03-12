import { len, sub } from '../utils/vec2.js';
import { deployments } from '../deployments/deployments.js';
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
}

const size = [60, 44];
const center = [30, 22];

export class MissionController {
	secondaryMission = [
		'ExtendBattleLines', 'DefendStronhold', 'OverhelmingForce', 'SecureNoMansLand', 'AreaDenial',
		'ATamptingTarget', 'CaptureEnemyOutpost', 'NoPrisoners', 'InvestigateSignals',
		'BehindEnemyLines', 'Assasination', 'Cleanse', 'DeployTeleportHomer', 'BringItDown', 
		'EngageOnAllFronts', 'StormHostileObjective' 
	];
	constructor(primaryMission, missionRule, secondaryMissions) {
		this.primaryMission = primaryMission;
		this.missionRule = missionRule;
		this.secondaryMissions = secondaryMissions;
		this.isFixed = false;
		this.tamptingTarget = getRandomInteger(0, 2);
	}

	scorePrimaryVP(state, profiles) {
		const turn = state.turn;
		const models = state.models;
		const activePlayerId = state.player
		const battlefield = state.battlefield;
		const round = Math.floor(turn / 2);
		const objectiveControlReward = 5;

		if (round < 1) {
			return 0;
		}
		const deployment = new deployments[battlefield.deployment];
		const objectiveMarkers = deployment.objective_markers;
		const objectiveControl = Array(objectiveMarkers.length).fill(0);
		state.players.forEach((player, modelPlayerId) => {
			player.models.forEach(modelId => {
				objectiveMarkers.forEach((markerPosition, i) => {
					const modelPosition = state.models[modelId];
					if (len(sub(modelPosition, markerPosition)) <= deployment.objective_marker_control_distance) {
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
		const isTactical = false;
		const activePlayerId = state.player
		const opponentPlayer = (state.player + 1) % 2
		const deployment = new deployments[battlefield.deployment];
		if (this.secondaryMissions.includes(Mission.BehindEnemyLines)) {	
			const hollyWithinCounter = state.players[state.player].models
				.filter((modelId) => deployment.include(opponentPlayer, state.models[modelId])).length;

			if (hollyWithinCounter >= 2) {
				secondaryVP += 2;
			}
			if(hollyWithinCounter > 0) {
				secondaryVP += isTactical ? 3 : 2;
			}
		}
		if (this.secondaryMissions.includes(Mission.EngageOnAllFronts)) {
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
				secondaryVP += isTactical ? 3 : 2;
			}
		}

		if (this.secondaryMissions.includes(Mission.Cleanse)) {
			const cleanseMarkers = [deployment.deploy_markers[opponentPlayer], ...deployment.nomansland_markers];
			const objectiveControl = Array(cleanseMarkers.length).fill(0);
			state.players.forEach((player, modelPlayerId) => {
				player.models.forEach(modelId => {
					cleanseMarkers.forEach((markerPosition, i) => {
						const modelPosition = state.models[modelId];
						if (len(sub(modelPosition, markerPosition)) <= deployment.objective_marker_control_distance) {
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
				secondaryVP += isTactical ? 3 : 2;
			}
		}

		if (this.secondaryMissions.includes(Mission.DeployTeleportHomer)) {
			let center6Circle = new Circle(...center, 6);
			let inOpponentDeploy = false;
			let inCenter = false;

			for (let modelId of state.players[state.player].models) {
				if (deployment.include(opponentPlayer, state.models[modelId])) {
					inOpponentDeploy = true;
					continue;
				} else if (center6Circle.include(...state.models[modelId])) {
					inCenter = true;
				}
			}

			if (inOpponentDeploy) {
				secondaryVP += isTactical ? 5 : 4;
			} else if (inCenter) {
				secondaryVP += isTactical ? 3 : 2;
			}
		}

		if (this.secondaryMissions.includes(Mission.InvestigateSignals)) {
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
		}

		if (this.secondaryMissions.includes(Mission.SecureNoMansLand)) {
			const objectiveControl = Array(deployment.nomansland_markers.length).fill(0);
			state.players.forEach((player, modelPlayerId) => {
				player.models.forEach(modelId => {
					deployment.nomansland_markers.forEach((markerPosition, i) => {
						const modelPosition = state.models[modelId];
						if (len(sub(modelPosition, markerPosition)) <= deployment.objective_marker_control_distance) {
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
			}
		}

		if (this.secondaryMissions.includes(Mission.AreaDenial)) {
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
			}
		}

		if (this.secondaryMissions.includes(Mission.DefendStronhold)) {
			const ownDelploymentMarker = deployment.deploy_markers[activePlayerId];
			let markerControl = 0;
			state.players.forEach((player, modelPlayerId) => {
				player.models.forEach(modelId => {
					const modelPosition = state.models[modelId];
					if (len(sub(modelPosition, ownDelploymentMarker)) <= deployment.objective_marker_control_distance) {
						const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
						const oc = profiles[modelId].oc * ocSign;
						markerControl += oc;
					}
				})
			});

			if (markerControl > 0) {
				secondaryVP += 3;
			}
		}

		if (this.secondaryMissions.includes(Mission.CaptureEnemyOutpost)) {
			const opponentMarker = deployment.deploy_markers[opponentPlayer];
			let markerControl = 0;
			state.players.forEach((player, modelPlayerId) => {
				player.models.forEach(modelId => {
					const modelPosition = state.models[modelId];
					if (len(sub(modelPosition, opponentMarker)) <= deployment.objective_marker_control_distance) {
						const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
						const oc = profiles[modelId].oc * ocSign;
						markerControl += oc;
					}
				})
			});

			if (markerControl > 0) {
				secondaryVP += 8;
			}
		}

		if (this.secondaryMissions.includes(Mission.ATamptingTarget)) {
			const targetMarker = deployment.nomansland_markers[this.tamptingTarget];
			let markerControl = 0;
			state.players.forEach((player, modelPlayerId) => {
				player.models.forEach(modelId => {
					const modelPosition = state.models[modelId];
					if (len(sub(modelPosition, targetMarker)) <= deployment.objective_marker_control_distance) {
						const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
						const oc = profiles[modelId].oc * ocSign;
						markerControl += oc;
					}
				})
			});

			if (markerControl > 0) {
				secondaryVP += 5;
			}
		}
		return secondaryVP;
	}
}

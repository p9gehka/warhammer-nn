import { len, sub } from '../utils/vec2.js';
import { deployments } from '../deployments/deployments.js';
import { Rect } from '../utils/planimatrics/rect.js';

export const Mission = {
	BehindEnemyLines: 'BehindEnemyLines',
	EngageOnAllFronts: 'EngageOnAllFronts',
	ExtendBattleLines: 'ExtendBattleLines',
}

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
	}

	scorePrimaryVP(state, battlefield, profiles) {
		const turn = state.turn;
		const models = state.models;
		const player = turn % 2;
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
						const ocSign = modelPlayerId === player ? 1 : -1;
						const oc = profiles[modelId].oc * ocSign;
						objectiveControl[i] += oc;
					}
				});
			})
		});

		return Math.min(objectiveControl.filter(oc => oc > 0).length * objectiveControlReward, 15);
	}
	scoreSecondaryVP(state, battlefield, profiles) {
		let secondaryVP = 0;
		const isTactical = false;
		const enemyPlayer = (state.player + 1) % 2
		if (this.secondaryMissions.includes(Mission.BehindEnemyLines)) {
			const deployment = new deployments[battlefield.deployment];
			const hollyWithinCounter = state.players[state.player].models
				.filter((modelId) => deployment.include(enemyPlayer, state.models[modelId])).length;

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
		return secondaryVP;
	}
}

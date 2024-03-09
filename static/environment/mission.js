import { len, sub } from '../utils/vec2.js';

export const Mission = {
	BehindEnemyLines: 'BehindEnemyLines',
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

	scorePrimaryVP(turn, models, objectiveMarker, objectiveMarkerControlDistance) {
		const player = turn % 2;
		const round = Math.floor(turn / 2);
		const objectiveControlReward = 5;

		if (round < 1) {
			return 0;
		}

		const objectiveControl = Array(objectiveMarker.length).fill(0);
		models.forEach((model) => {
			objectiveMarker.forEach((markerPosition, i) => {
				if (len(sub(model.position, markerPosition)) <= objectiveMarkerControlDistance) {
					const ocSign = model.playerId === player ? 1 : -1;
					const oc = model.unitProfile.oc * ocSign;
					objectiveControl[i] += oc;
				}
			});
		});

		return Math.min(objectiveControl.filter(oc => oc > 0).length * objectiveControlReward, 15);
	}
	scoreSecondaryVP() {
		return 0;
	}
}
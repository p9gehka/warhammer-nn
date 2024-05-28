import { len, sub } from '../utils/vec2.js';
import { deployment } from '../battlefield/deployment.js';

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
	Assassination: 'Assassination',
	NoPrisoners: 'NoPrisoners',
	BringItDown: 'BringItDown',
	OverwhelmingForce: 'OverwhelmingForce',
	StormHostileObjective: 'StormHostileObjective',
}

const size = [60, 44];
const center = [30, 22];

function onBattlefield(position) {
	return !isNaN(position[0]);
}
export class MissionController {
	startTurnObjectiveControl = [];
	constructor(primary, missionRule) {
		this.primary = primary;
		this.missionRule = missionRule;
	}

	reset() {
		this.startTurnObjectiveControl = [];
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
}
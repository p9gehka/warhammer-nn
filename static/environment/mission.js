import { len, sub } from '../utils/vec2.js';
import { deployment } from '../battlefield/deployment.js';


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

		this.startTurnObjectiveControl = objectiveControl;
	}
	scorePrimaryVP(state, profiles) {
		const turn = state.turn;
		const round = Math.floor(turn / 2);
		const objectiveControlReward = 5;

		return Math.min(this.startTurnObjectiveControl.filter(oc => oc > 3).length * objectiveControlReward, 15);
	}
}
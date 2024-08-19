import { DeploymentCommon } from './deployment-common.js';
import { Rect } from '../utils/planimatrics/rect.js';

export class ClashOfPatrols extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[12, 15], [22, 9], [32, 15], [22, 21]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];

	constructor() {
		super();

		this.include_rect = [[0, 25, 44, 5], [0, 0, 44, 5]];
		this.deployment_zone = [0, 1].map(i => {
			return { include: new Rect(...this.include_rect[i]) };
		});
	}
}

export class ArcheothechRecovery extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[6, 23], [14, 7], [22,15], [30, 23], [38, 7]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class ForwardOutpost extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[6, 15], [22, 7], [38, 15], [22, 23]]
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class ScorchedEarth extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[12, 11], [22, 9], [32, 19], [22, 21]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class SweepingRaid extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[6, 21], [19, 6],  [38, 9],  [25, 24]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class DisplayOfMight extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[8, 15], [22, 7], [36, 15], [22, 23]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Empty44x30 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

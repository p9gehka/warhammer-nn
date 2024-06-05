import { DeploymentCommon } from './deployment-common.js';

export class Medium36_1 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[10, 15], [20, 9], [30, 15], [20, 21]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_2 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[5, 23], [12, 7], [20, 15], [28, 23], [35, 7]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_3 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[5, 15], [20, 7], [35, 15], [20, 23]]
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_4 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[10, 11], [20, 9], [30, 19], [20, 21]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_5 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[5, 21], [17, 6],  [35, 9],  [23, 24]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_6 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[6, 15], [20, 7], [34, 15], [20, 23]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

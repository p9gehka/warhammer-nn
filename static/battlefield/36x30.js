import { DeploymentCommon } from './deployment-common.js';

export class Medium36_1 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[8, 15], [18, 9], [28, 15], [18, 21]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_2 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[3, 23], [10, 7], [18,15], [26, 23], [33, 7]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_3 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[3, 15], [18, 7], [33, 15], [18, 23]]
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_4 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[8, 11], [18, 9], [28, 19], [18, 21]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_5 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[3, 21], [15, 6],  [33, 9],  [21, 24]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_6 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[4, 15], [18, 7], [32, 15], [18, 23]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}
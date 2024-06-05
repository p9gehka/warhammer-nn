import { DeploymentCommon } from './deployment-common.js';

export class Medium36_1 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[9, 6], [18, 15], [27, 6], [9, 24], [27, 24]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_2 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[18, 6], [27, 15], [17, 24], [9, 15]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_3 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[11, 8], [25, 11], [11, 19], [25, 22]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium36_4 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[14, 8], [25, 8], [11, 22], [22, 22]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

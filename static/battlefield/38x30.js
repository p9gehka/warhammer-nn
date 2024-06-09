import { DeploymentCommon } from './deployment-common.js';

export class Medium38_1 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[9, 15], [19, 9], [29, 15], [19, 21]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium38_2 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[4, 23], [11, 7], [19, 15], [27, 23], [34, 7]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium38_3 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[4, 15], [19, 7], [34, 15], [19, 23]]
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium38_4 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[9, 11], [19, 9], [29, 19], [19, 21]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium38_5 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[4, 21], [16, 6],  [34, 9],  [22, 24]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium38_6 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[5, 15], [19, 7], [33, 15], [19, 23]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

import { DeploymentCommon } from './deployment-common.js';

export class Large44_1 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[12, 22], [22, 16], [32, 22], [22, 28]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Large44_2 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[6, 30], [14, 14], [22,22], [30, 30], [38, 14]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Large44_3 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[6, 22], [22, 14], [38, 22], [22, 30]]
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Large44_4 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[12, 19], [22, 16], [32, 26], [22, 28]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Large44_5 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[6, 28], [19, 13],  [38, 16],  [25, 31]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Large44_6 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[8, 22], [22, 14], [36, 22], [22, 30]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Empty44 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

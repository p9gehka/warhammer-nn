import { DeploymentCommon } from './deployment-common.js';

export class Medium1 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[6, 6], [15, 15], [24, 6], [6, 24], [24, 24]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium2 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[15, 6], [24, 15], [15, 24], [6, 15]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium3 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[8, 8], [22, 11], [8, 19], [22, 22]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Medium4 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[11, 8], [22, 8], [8, 22], [19, 22]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

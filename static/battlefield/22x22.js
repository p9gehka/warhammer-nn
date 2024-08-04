import { DeploymentCommon } from './deployment-common.js';

export class SmallFull1 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[3, 3], [11, 11], [19, 6], [3, 16], [19, 19]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class SmallFull2 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[11, 3], [19, 11], [11, 19], [3, 11]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class SmallFull3 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[3, 3], [19, 3], [3, 19], [19, 19]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class SmallFull4 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[6, 3], [19, 3], [3, 19], [16, 19]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Small1 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[11, 11]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Small2 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[3, 3]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Small3 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[19, 3]]
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Small4 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[3, 19]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Small5 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[19, 19]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Small6 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

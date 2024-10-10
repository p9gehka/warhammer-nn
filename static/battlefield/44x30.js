import { DeploymentCommon } from './deployment-common.js';

export class ClashOfPatrols extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[12, 15], [22, 9], [32, 15], [22, 21]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
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

export class ClashOfPatrolsHalf extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[12, 15], [32, 15]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class ArcheothechRecoveryHalf extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[6, 23], [38, 7]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class ForwardOutpostHalf extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[22, 7], [22, 23]]
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class ScorchedEarthHalf extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[22, 9], [22, 21]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class SweepingRaidHalf extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[6, 21], [38, 9]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class DisplayOfMightHalf extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[8, 15], [36, 15],];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}


export class Empty44x30 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

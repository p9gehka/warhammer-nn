import { DeploymentCommon } from './deployment-common.js';

export class CrucibleOfBattle extends DeploymentCommon {
	deploy_markers = [[14, 34], [46, 10]];
	nomansland_markers = [[20, 8], [30, 22], [40, 36]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class DawnOfWar extends DeploymentCommon {
	deploy_markers = [[30, 6], [30, 38]];
	nomansland_markers = [[10, 22], [30, 22], [50, 22]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class HammerAndAnvil extends DeploymentCommon {
	deploy_markers = [[10, 22], [50, 22]];
	nomansland_markers = [[30, 6], [30, 22], [30, 38]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class SearchAndDestroy extends DeploymentCommon {
	deploy_markers = [[14, 33], [46, 9]];
	nomansland_markers = [[14, 9], [30, 22], [46, 33]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class SweepingEngagement extends DeploymentCommon {
	deploy_markers = [[18, 38], [42, 6]];
	nomansland_markers = [[10, 14], [30, 22], [50, 30]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}


export class ClashOfPatrols60x44 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[15, 12], [9, 22], [15, 32], [21, 22], [ 45, 12 ], [ 39, 22 ], [ 45, 32 ], [ 51, 22 ]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class ArcheothechRecovery60x44 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[23,6],[7,14],[15,22],[23,30],[7,38], [ 53, 6 ], [ 37, 14 ], [ 45, 22 ], [ 53, 30 ], [ 37, 38 ]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class ForwardOutpost60x44 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[15,6],[7,22],[15,38],[23,22],[ 45, 6 ], [ 37, 22 ], [ 45, 38 ], [ 53, 22 ]]
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class ScorchedEarth60x44 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[11,12],[9,22],[19,32],[21,22], [ 41, 12 ], [ 39, 22 ], [ 49, 32 ], [ 51, 22 ]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class SweepingRaid60x44 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[21,6],[6,19],[9,38],[24,25], [ 41, 12 ], [ 39, 22 ], [ 49, 32 ], [ 51, 22 ]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class DisplayOfMight60x44 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [[15,8],[7,22],[15,36],[23,22], [ 45, 8 ], [ 37, 22 ], [ 45, 36 ], [ 53, 22 ]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

export class Empty60x44 extends DeploymentCommon {
	deploy_markers = [];
	nomansland_markers = [];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}


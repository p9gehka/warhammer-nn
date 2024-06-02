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
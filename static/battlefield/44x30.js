import { DeploymentCommon } from './deployment-common.js';
import { Rect } from '../utils/planimatrics/rect.js';
import { Triangle } from '../utils/planimatrics/triangle.js';

export class ClashOfPatrols extends DeploymentCommon {
	nomansland_markers = [[12, 15], [22, 9], [32, 15], [22, 21]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];

	constructor() {
		super();

		this.include_rect = [[0, 25, 44, 5], [0, 0, 44, 5]];
		this.deployment_zone = [0, 1].map(i => {
			return { include: new Rect(...this.include_rect[i]) };
		});
	}
}

export class ArcheothechRecovery extends DeploymentCommon {
	nomansland_markers = [[6, 23], [14, 7], [22,15], [30, 23], [38, 7]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];

	constructor() {
		super();

		this.include_rect = [[0, 0, 10, 30], [34, 0, 10, 30]];
		this.deployment_zone = [0, 1].map(i => {
			return { include: new Rect(...this.include_rect[i]) };
		});
	}
}

export class ForwardOutpost extends DeploymentCommon {
	nomansland_markers = [[6, 15], [22, 7], [38, 15], [22, 23]]
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
	constructor() {
		super();

		this.include_rect = [[0, 0, 10, 30], [34, 0, 10, 30]];
		this.deployment_zone = [0, 1].map(i => {
			return { include: new Rect(...this.include_rect[i]) };
		});
	}
}

export class ScorchedEarth extends DeploymentCommon {
	nomansland_markers = [[12, 11], [22, 9], [32, 19], [22, 21]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
	constructor() {
		super();

		this.include_triangle = [[[0, 0], [0, 30], [22, 30]], [[22, 0], [44, 0], [44, 30]]];

		this.deployment_zone = [0, 1].map(i => {
			return { include: new Triangle(...this.include_triangle[i].flat()) }
		});
	}
}

export class SweepingRaid extends DeploymentCommon {
	nomansland_markers = [[6, 21], [19, 6],  [38, 9],  [25, 24]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
	constructor() {
		super();

		this.include_rect = [[0, 0, 10, 30], [34, 0, 10, 30]];
		this.deployment_zone = [0, 1].map(i => {
			return { include: new Rect(...this.include_rect[i]) };
		});
	}
}

export class DisplayOfMight extends DeploymentCommon {
	nomansland_markers = [[8, 15], [22, 7], [36, 15], [22, 23]];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
	constructor() {
		super();

		this.include_rect = [[0, 0, 10, 30], [34, 0, 10, 30]];
		this.deployment_zone = [0, 1].map(i => {
			return { include: new Rect(...this.include_rect[i]) };
		});
	}
}

export class Empty44x30 extends DeploymentCommon {
	nomansland_markers = [];
	objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
}

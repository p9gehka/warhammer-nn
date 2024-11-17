import { DeploymentCommon } from './deployment-common.js';
import { Rect } from '../utils/planimatrics/rect.js';
import { Circle } from '../utils/planimatrics/circle.js';
import { Triangle } from '../utils/planimatrics/triangle.js';

export class CrucibleOfBattle extends DeploymentCommon {
	constructor() {
		super();
		this.deploy_markers = [[14, 34], [46, 10]];
		this.nomansland_markers = [[20, 8], [30, 22], [40, 36]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.include_triangle = [[[0, 0], [0, 44], [30, 44]], [[30, 0], [60, 0], [60, 44]]];

		this.deployment_zone = [0, 1].map(i => {
			return { include: new Triangle(...this.include_triangle[i].flat()) }
		});
	}
}

export class DawnOfWar extends DeploymentCommon {
	constructor() {
		super();
		this.deploy_markers = [[30, 6], [30, 38]];
		this.nomansland_markers = [[10, 22], [30, 22], [50, 22]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];

		this.include_rect = [[0, 32, 60, 12], [0, 0, 60, 12]];
		this.deployment_zone = [0, 1].map(i => {
			return { include: new Rect(...this.include_rect[i]) };
		});
	}
}

export class HammerAndAnvil extends DeploymentCommon {
	constructor() {
		super();
		this.deploy_markers = [[10, 22], [50, 22]];
		this.nomansland_markers = [[30, 6], [30, 22], [30, 38]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.include_rect = [[0, 0, 18, 44], [42, 0, 18, 44]];
		this.deployment_zone = [0, 1].map(i => {
			return { include: new Rect(...this.include_rect[i]) };
		});
	}
}

export class SearchAndDestroy extends DeploymentCommon {
	constructor() {
		super();
		this.deploy_markers = [[14, 33], [46, 9]];
		this.nomansland_markers = [[14, 9], [30, 22], [46, 33]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];

		this.include_rect = [[0, 22, 30, 44], [30, 0, 60, 22]];
		this.exclude_circle = [[30, 22, 9]];
		this.deployment_zone = [0, 1].map(i => {
			return {
				include: new Rect(...this.include_rect[i]),
				exclude: new Circle(...this.exclude_circle)
			};
		});
	}
}

export class SweepingEngagement extends DeploymentCommon {
	constructor() {
		super();
		this.deploy_markers = [[18, 38], [42, 6]];
		this.nomansland_markers = [[10, 18], [30, 22], [50, 26]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];

		this.include_rect = [[0, 30, 60, 14], [0, 0, 60, 14]];
		this.exclude_rect = [[30, 30, 30, 6], [0, 8, 30, 6]];
		this.deployment_zone = [0, 1].map(i => {
			return { include: new Rect(...this.include_rect[i]), exclude: new Rect(...this.exclude_rect[i]) };
		});
	}
}

export class TippingPoint extends DeploymentCommon {
	constructor() {
		super();
		this.deploy_markers = [[14, 34], [46, 10]];
		this.nomansland_markers = [[22, 8], [30, 22], [38, 36]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.include_rect = [[0, 0, 20, 44], [40, 0, 20, 44]];
		this.exclude_rect = [[12, 0, 8, 22], [40, 22, 8, 22]];
		this.deployment_zone = [0, 1].map(i => {
			return { include: new Rect(...this.include_rect[i]), exclude: new Rect(...this.exclude_rect[i]) };
		});
	}
}

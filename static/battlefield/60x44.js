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
	getDrawings() {
		const playerColors = ["red", "blue"];
		const deployments = this.include_triangle.map((points, i) => {
			return { strokeStyle: playerColors[i], methods: ['moveTo', 'lineTo', 'lineTo'], args: points };
		});

		const objectiveMarkers = this.objective_markers.map(
			(position, i) => this.getObjectDrawing(position, this.objective_marker_control_distance)
		);
		return [...deployments, ...objectiveMarkers];
	}
	include(id, position) {
		return this.deployment_zone[id].include.include(...position);
	}

}

export class DawnOfWar extends DeploymentCommon {
	constructor() {
		super();
		this.deploy_markers = [[30, 6], [30, 38]];
		this.nomansland_markers = [[10, 22], [30, 22], [50, 22]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];

		this.include_rect = [[0, 34, 60, 10], [0, 0, 60, 10]];
		this.deployment_zone = [0, 1].map(i => {
			return { include: new Rect(...this.include_rect[i]) };
		});

	}
	getDrawings() {
		const playerColors = ["red", "blue"];
		const deployments = this.include_rect.map((deployment, i) => {
			return { strokeStyle: playerColors[i], methods: ['rect'], args: [deployment] }
		});

		const objectiveMarkers = this.objective_markers.map(
			(position, i) => this.getObjectDrawing(position, this.objective_marker_control_distance)
		);
		return [...deployments, ...objectiveMarkers];
	}
	include(id, position) {
		return this.deployment_zone[id].include.include(...position);
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
	getDrawings() {
		const playerColors = ["red", "blue"];
		const deployments = this.include_rect.map((deployment, i) => {
			return { strokeStyle: playerColors[i], methods: ['rect'], args: [deployment] }
		});

		const objectiveMarkers = this.objective_markers.map(
			(position, i) => this.getObjectDrawing(position, this.objective_marker_control_distance)
		);
		return [...deployments, ...objectiveMarkers];
	}
	include(id, position) {
		return this.deployment_zone[id].include.include(...position);
	}
}

export class SearchAndDestroy extends DeploymentCommon {
	constructor() {
		super();
		this.deploy_markers = [[14, 33], [46, 9]];
		this.nomansland_markers = [[14, 9], [30, 22], [46, 33]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];

		this.include_rect = [[0, 22, 30, 44], [30, 0, 60, 22]];
		this.exclude_circle = [30, 22, 9];
		this.deployment_zone = [0, 1].map(i => {
			return {
				include: new Rect(...this.include_rect[i]),
				exclude: new Circle(...this.exclude_circle)
			};
		});
	}
	getDrawings() {
		const playerColors = ["red", "blue"];
		const deployments = this.include_rect.map((deployment, i) => {
			return { strokeStyle: playerColors[i], methods: ['rect'], args: [deployment] }
		});

		deployments.push({
			strokeStyle: 'green',
			methods: ['ellipse'],
			args: [[...this.exclude_circle, this.exclude_circle[2], 0, 0, 2 * Math.PI]]
		});

		const objectiveMarkers = this.objective_markers.map(
			(position, i) => this.getObjectDrawing(position, this.objective_marker_control_distance)
		);

		return [...deployments, ...objectiveMarkers];
	}

	include(id, position) {
		return this.deployment_zone[id].include.include(...position) && !this.deployment_zone[id].exclude.include(...position);
	}
}

export class SweepingEngagement extends DeploymentCommon {
	constructor() {
		super();
		this.deploy_markers = [[18, 38], [42, 6]];
		this.nomansland_markers = [[10, 14], [30, 22], [50, 30]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.include_triangle = [[[0, 22], [60, 44], [0, 44]], [[0, 0], [60, 0], [60, 22]]];

		this.deployment_zone = [0, 1].map(i => {
			return { include: new Triangle(...this.include_triangle[i].flat()) }
		});
	}
	getDrawings() {
		const playerColors = ["red", "blue"];
		const deployments = this.include_triangle.map((points, i) => {
			return { strokeStyle: playerColors[i], methods: ['moveTo', 'lineTo', 'lineTo'], args: points };
		});

		const objectiveMarkers = this.objective_markers.map(
			(position, i) => this.getObjectDrawing(position, this.objective_marker_control_distance)
		);

		return [...deployments, ...objectiveMarkers];
	}
	include(id, position) {
		return this.deployment_zone[id].include.include(...position);
	}
}

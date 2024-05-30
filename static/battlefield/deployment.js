function getObjectDrawing(position, radius) {
	const args = [[ ...position, radius, radius, 0, 0, 2 * Math.PI]];
	return { strokeStyle: "burlywood", methods: ['ellipse'],  args };
}

class CrucibleOfBattle {
	constructor() {
		this.deploy_markers = [[14, 34], [46, 10]];
		this.nomansland_markers = [[20, 8], [30, 22], [40, 36]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}

}

class DawnOfWar {
	constructor() {
		this.deploy_markers = [[30, 6], [30, 38]];
		this.nomansland_markers = [[10, 22], [30, 22], [50, 22]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class HammerAndAnvil {
	constructor() {
		this.deploy_markers = [[10, 22], [50, 22]];
		this.nomansland_markers = [[30, 6], [30, 22], [30, 38]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class SearchAndDestroy  {
	constructor() {
		this.deploy_markers = [[14, 33], [46, 9]];
		this.nomansland_markers = [[14, 9], [30, 22], [46, 33]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class SweepingEngagement {
	constructor() {
		this.deploy_markers = [[18, 38], [42, 6]];
		this.nomansland_markers = [[10, 14], [30, 22], [50, 30]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class small1 {
	constructor() {
		this.deploy_markers = [];
		this.nomansland_markers = [];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class small2 {
	constructor() {
		this.deploy_markers = [];
		this.nomansland_markers = [[15, 15]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class small3 {
	constructor() {
		this.deploy_markers = [];
		this.nomansland_markers = [[5, 5]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class small4 {
	constructor() {
		this.deploy_markers = [];
		this.nomansland_markers = [[25, 5]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class small5 {
	constructor() {
		this.deploy_markers = [];
		this.nomansland_markers = [[5, 25]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class small6 {
	constructor() {
		this.deploy_markers = [];
		this.nomansland_markers = [[25, 25]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

export const deployment = {
	"crucibleOfBattle": CrucibleOfBattle,
	"dawnOfWar": DawnOfWar,
	"hammerAndAnvil": HammerAndAnvil,
	"searchAndDestroy": SearchAndDestroy,
	"sweepingEngagement": SweepingEngagement,
	small1,
	small2,
	small3,
	small4,
	small5,
	small6,
}
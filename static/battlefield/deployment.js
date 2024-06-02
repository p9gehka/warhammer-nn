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

/*

*/

class ClashOfPatrols {
	constructor() {
		this.deploy_markers = [];
		this.nomansland_markers = [[12, 15], [22, 9], [32, 15], [22, 21]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class ArcheothechRecovery {
	constructor() {
		this.deploy_markers = [];
		this.nomansland_markers = [[6, 23], [14, 7], [22,15], [30, 23], [38, 7]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class ForwardOutpost {
	constructor() {
		this.deploy_markers = [];
		this.nomansland_markers = [[6, 15], [22, 7], [38, 15], [22, 23]]
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class ScorchedEarth {
	constructor() {
		this.deploy_markers = [];
		this.nomansland_markers = [[12, 11], [22, 9], [32, 19], [22, 21]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class SweepingRaid {
	constructor() {
		this.deploy_markers = [];
		this.nomansland_markers = [[6, 21], [19, 6],  [38, 9],  [25, 24]];
		this.objective_markers = [...this.deploy_markers, ...this.nomansland_markers];
		this.objective_marker_control_distance = 3;
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

class DisplayOfMight {
	constructor() {
		this.deploy_markers = [];
		this.nomansland_markers = [[8, 15], [22, 7], [36, 15], [22, 23]];
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
	"clashOfPatrols": ClashOfPatrols,
	"archeothechRecovery": ArcheothechRecovery,
	"forwardOutpost": ForwardOutpost,
	"scorchedEarth": ScorchedEarth,
	"sweepingRaid": SweepingRaid,
	"displayOfMight": DisplayOfMight,
}
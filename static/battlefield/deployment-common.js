export class DeploymentCommon {
	objective_marker_control_distance = 3;
	include_triangle = [];
	include_rect = [];
	exclude_circle = [];
	objective_markers = [];

	getObjectDrawing(position, radius) {
		const args = [[ ...position, radius, radius, 0, 0, 2 * Math.PI]];
		return { strokeStyle: "burlywood", methods: ['ellipse'],  args };
	}

	getDrawings() {
		const playerColors = ["red", "blue"];
		const deployments = []
		this.include_triangle.forEach((points, i) => {
			 deployments.push({ strokeStyle: playerColors[i], methods: ['moveTo', 'lineTo', 'lineTo'], args: points });
		});

		this.include_rect.forEach((deployment, i) => {
			deployments.push({ strokeStyle: playerColors[i], methods: ['rect'], args: [deployment] })
		});

		this.exclude_circle.forEach(circle => {
			deployments.push({
				strokeStyle: 'green',
				methods: ['ellipse'],
				args: [[...circle, circle[2], 0, 0, 2 * Math.PI]]
			});
		});
		const objectiveMarkers = this.objective_markers.map(
			(position, i) => this.getObjectDrawing(position, this.objective_marker_control_distance)
		);

		return [...deployments, ...objectiveMarkers];
	}

	include(id, position) {
		return this.deployment_zone[id].include?.include(...position) && !this.deployment_zone[id].exclude?.include(...position);
	}
}

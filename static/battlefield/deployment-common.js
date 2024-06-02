export class DeploymentCommon {
	objective_marker_control_distance = 3;
	getObjectDrawing(position, radius) {
		const args = [[ ...position, radius, radius, 0, 0, 2 * Math.PI]];
		return { strokeStyle: "burlywood", methods: ['ellipse'],  args };
	}
	getDrawings() {
		return this.objective_markers.map(
			(position, i) => this.getObjectDrawing(position, this.objective_marker_control_distance)
		);
	}
}

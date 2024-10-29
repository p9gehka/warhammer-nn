function getCratersDrawing(x, y, radius) {
	const args = [[x, y, radius, radius, 0, 0, 2 * Math.PI]];
	return { fillStyle: "#8b4513d1", methods: ['ellipse'],  args };
}

export class Terrain {
	rectangleFootprints = [];
	triangleFootprints = [];
	containers = []
	craters = [];
	getDrawings() {
		const triangleFootprints = this.triangleFootprints.map((points, i) => {
			return { fillStyle: '#FFFFFF55', methods: ['moveTo', 'lineTo', 'lineTo'], args: points };
		});
		const rectangleFootprints = this.rectangleFootprints.map((points, i) => {
			return { fillStyle: '#00000055', methods: ['moveTo', 'lineTo', 'lineTo', 'moveTo', 'lineTo', 'lineTo'], args: this.convertRectancleToTriangles(points) };
		});
		const containers = this.containers.map((points, i) => {
			return { fillStyle: '#000000', methods: ['moveTo', 'lineTo', 'lineTo', 'moveTo', 'lineTo', 'lineTo'], args: this.convertRectancleToTriangles(points) };
		});

		const craters = this.craters.map(
			(position, i) => getCratersDrawing(...position, 3)
		);
		return [
			...rectangleFootprints,
			...triangleFootprints,
			...containers,
			...craters
		];
	}
	convertRectancleToTriangles([A,B,C,D]) {
		return [A, B, C, C, D, A]
	}
	getRectangleFootpintsAsTriangles() {
		return this.rectangleFootprints.map(([A,B,C,D]) => [[A, B, C], [C, D, A]])
	}
}

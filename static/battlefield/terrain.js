import { getLineIntersection } from '../utils/planimatrics/index.js';

function getCratersDrawing(x, y, radius) {
	const args = [[ x, y, radius, radius, 0, 0, 2 * Math.PI]];
	return { fillStyle: "#8b4513d1", methods: ['ellipse'],  args };
}

class Terrain {
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
	isVisible(point1, point2) {
		const visibilityLine = [point1, point2];
		const footprints = [...this.triangleFootprints, ...this.rectangleFootprints];
		for (let footprintEdge of footprints) {
			let intersections = 0;
			for (let i = 0; i < footprintEdge.length; i++) {
				if (getLineIntersection(visibilityLine, [footprintEdge[i], footprintEdge[(i+1) % 3]]) !== null) {
					intersections++;
				}
				if (intersections >= 2) {
					return false;
				}
			}
		}
		return true;
	}
	convertRectancleToTriangles([A,B,C,D]) {
		return [A, B, C, C, D, A]
	}
}
class GeeseValdas13 extends Terrain {
	rectangleFootprints = [
		[[5, 35], [9, 31], [17, 39], [13, 43]],
		[[55, 9], [51, 13], [43, 5], [47, 1]]
	];
	triangleFootprints = [
		[[7, 15], [13, 15], [13, 25]],
		[[23, 33], [29, 33], [29, 43]],
		[[22, 19], [25, 28], [31, 26]],
		[[29, 18], [35, 16], [38, 25]],
		[[31, 1], [37, 11], [31, 11]],
		[[47, 20], [53, 30], [47, 30]],
	];
	containers = [
		[[15, 14], [20, 8], [22, 9], [17, 15]],
		[[ 45, 30 ], [ 40, 36 ], [ 38, 35 ], [ 43, 29 ]]
	];
	craters = [[25, 13], [39, 14], [ 35, 31 ], [ 21, 30 ]];
}


class GeeseValdas46 extends Terrain {
	rectangleFootprints = [
		[[4, 33], [7, 28], [17, 33], [14, 38]],
		[[ 56, 11 ], [ 53, 16 ], [ 43, 11 ], [ 46, 6 ]]
	];
	triangleFootprints = [
		[[15, 9], [26, 6], [24, 12]],
		[[30, 9], [40, 4], [39, 10]],
		[[28, 19], [31, 14], [39, 18]],
		[ [ 45, 35 ], [ 34, 38 ], [ 36, 32 ] ],
		[ [ 30, 35 ], [ 20, 40 ], [ 21, 34 ] ],
		[ [ 32, 25 ], [ 29, 30 ], [ 21, 26 ] ]
	];
	containers = [
		[[10, 18], [15, 14], [16, 16], [11, 20]],
		[[ 50, 26 ], [ 45, 30 ], [ 44, 28 ], [ 49, 24 ]]
	];
	craters = [[22, 18], [15, 27], [38, 26], [45, 17]]
}

class GeeseValdas79 extends Terrain {
	rectangleFootprints = [
		[[12, 15], [18, 16], [16, 27], [10, 26]],
		[[ 48, 29 ], [ 42, 28 ], [ 44, 17 ], [ 50, 18 ]]
	];
	triangleFootprints = [
		[[19, 0], [25, 3], [19, 12]],
		[[21, 19], [27, 20], [26, 30]],
		[[8, 32], [14, 30], [17, 40]],
		[ [ 41, 44 ], [ 35, 41 ], [ 41, 32 ] ],
		[ [ 39, 25 ], [ 33, 24 ], [ 34, 14 ] ],
		[ [ 52, 12 ], [ 46, 14 ], [ 43, 4 ] ],
	];
	containers = [
		[[31, 6], [33, 6], [33, 11],  [31, 11]],
		[[29, 11], [31, 11], [31, 13], [29, 1]],
		[ [ 29, 38 ], [ 27, 38 ], [ 27, 33 ], [ 29, 33 ]],
		[ [ 31, 33 ], [ 29, 33 ], [ 29, 31 ], [ 31, 31 ]]
	];
	craters = [[24, 15], [38, 10],[ 36, 29 ], [ 22, 34 ]];
}

class GeeseValdas1012 extends Terrain {
	rectangleFootprints = [
		[[21, 7], [32, 7], [32, 13], [21, 13]],
		[[ 39, 37 ],[ 28, 37 ],[ 28, 31 ],[ 39, 31 ]]
	];
	triangleFootprints = [
		[[15, 5], [17, 10], [8, 13]],
		[[37, 9], [48, 5], [47, 11]],
		[[31, 15], [39, 20], [27, 20]],
		[ [ 45, 39 ], [ 43, 34 ], [ 52, 31 ] ],
		[ [ 23, 35 ], [ 12, 39 ], [ 13, 33 ] ],
		[ [ 29, 29 ], [ 21, 24 ], [ 33, 24 ] ]
	];
	containers = [
		[[7, 23], [12, 23], [12, 25], [7, 25]],
		[[12, 21], [14, 21], [14, 23], [12, 23]],
		[[ 53, 21 ],[ 48, 21 ],[ 48, 19 ], [ 53, 19 ]],
		[[ 48, 23 ],[ 46, 23 ],[ 46, 21 ],[ 48, 21 ]]
	]
	craters = [[21, 17], [17, 29], [ 39, 27 ], [ 43, 15 ]];
}

class GeeseValdas1315 extends Terrain {
	rectangleFootprints = [
		[[13, 31], [18, 28], [24, 36],[19, 39]],
		[ [ 47, 13 ], [ 42, 16 ], [ 36, 8 ],[ 41, 5 ]]
	];
	triangleFootprints = [
		[[13, 3], [19, 3], [19, 13]],
		[[4, 14], [10, 13], [12, 23]],
		[[20, 21], [25, 19], [30, 28]],
		[ [ 47, 41 ], [ 41, 41 ], [ 41, 31 ] ],
		[ [ 56, 30 ], [ 50, 31 ], [ 48, 21 ] ],
		[ [ 40, 23 ], [ 35, 25 ], [ 30, 16 ] ]
	];
	containers = [
		[[25, 9], [27, 10], [26, 17], [24, 16]],
		[[ 35, 35 ],[ 33, 34 ],[ 34, 27 ],[ 36, 28 ]]
	];
	craters = [[17, 18], [33, 10], [ 43, 26 ], [ 27, 34 ]];
}

export const terrain = {
	"geeseValdas1-3": GeeseValdas13,
	"geeseValdas4-6": GeeseValdas46,
	"geeseValdas7-9": GeeseValdas79,
	"geeseValdas10-12": GeeseValdas1012,
	"geeseValdas13-15": GeeseValdas1315
}

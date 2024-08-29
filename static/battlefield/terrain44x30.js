import { Terrain } from './terrain-common.js';

export class ArkunashaRuins extends Terrain {
	rectangleFootprints = [
		[[17, 12], [27, 12], [27, 18], [17, 18]],
		[[0, 13], [6, 13], [6, 17], [0, 17]],
		[[38, 13], [44, 13], [44, 17], [38, 17]],
		[[5, 20], [15, 20], [15, 26], [5, 26]],	
		[[5, 4], [15, 4], [15, 10], [5, 10]],
		[[29, 20], [39, 20], [39, 26], [29, 26]],
		[[29, 4], [39, 4], [39, 10], [29, 10]],
	];
	triangleFootprints = [];
	containers = []
	craters = [];
}

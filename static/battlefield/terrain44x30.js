import { Terrain } from './terrain-common.js';

function baseVerticalRuin(x, y) {
	return [[0, 0], [6, 0], [6, 10], [0, 10]].map(([x1, y1]) => [x1 + x, y1 + y]);
}

function baseHorisontalRuin(x, y) {
	return [[0, 0], [0, 6], [10, 6], [10, 0]].map(([x1, y1]) => [x1 + x, y1 + y]);
}

function thinVerticalRuin(x, y) {
	return [[0, 0], [4, 0], [4, 6], [0, 6]].map(([x1, y1]) => [x1 + x, y1 + y]);
}

function thinHorisontalRuin(x, y) {
	return [[0, 0], [0, 4], [6, 4], [6, 0]].map(([x1, y1]) => [x1 + x, y1 + y]);
}

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

export class FedrasTemple extends Terrain {
	rectangleFootprints = [
		baseVerticalRuin(14, 0),
		baseVerticalRuin(5, 18),
		thinVerticalRuin(16, 14),

		baseVerticalRuin(24, 20),
		baseVerticalRuin(33, 2),
		thinVerticalRuin(24, 10),
	];
	triangleFootprints = [];
	containers = []
	craters = [];
}

export class DalitCity extends Terrain {
	rectangleFootprints = [
		baseVerticalRuin(7, 10),
		baseHorisontalRuin(17, 12),
		baseVerticalRuin(21, 20),
		thinVerticalRuin(7, 24),

		baseVerticalRuin(31,10),
		baseVerticalRuin(17,0),
		thinVerticalRuin(33,0)
	];
	triangleFootprints = [];
	containers = []
	craters = [];
}


export class AgrellanFavelas extends Terrain {
	rectangleFootprints = [
		baseVerticalRuin(14, 0),
		thinHorisontalRuin(13, 13),
		thinVerticalRuin(5, 9),
		baseVerticalRuin(9, 20),

		baseVerticalRuin(24, 20),
		thinHorisontalRuin(25, 13),
		thinVerticalRuin(35, 15),
		baseVerticalRuin(29, 0),
	];
	triangleFootprints = [];
	containers = []
	craters = [];
}

export class FirecastOutpost extends Terrain {
	rectangleFootprints = [
		baseVerticalRuin(7, 20),
		baseHorisontalRuin(3, 14),
		baseVerticalRuin(20, 0),
		baseHorisontalRuin(10, 4),

		baseVerticalRuin(31, 0),
		baseHorisontalRuin(31, 10),
		baseVerticalRuin(18, 20),
		baseHorisontalRuin(24, 20),

	];
	triangleFootprints = [];
	containers = []
	craters = [];
}

export class StantionFortress extends Terrain {
	rectangleFootprints = [
		thinVerticalRuin(16, 15),
		thinVerticalRuin(6, 6),
		thinVerticalRuin(2, 20),
		thinVerticalRuin(20, 0),

		thinVerticalRuin(34, 18),
		thinVerticalRuin(24, 9),
		thinVerticalRuin(24, 24),
		thinVerticalRuin(38, 4),
	];
	triangleFootprints = [];
	containers = []
	craters = [];
}

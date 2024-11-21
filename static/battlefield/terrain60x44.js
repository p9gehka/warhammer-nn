import { Terrain } from './terrain-common.js';
import { footprint10x7, footprint5x2, footprint2x2, footprintRotatedDegrees } from './terrain-helper.js';


export class GeeseValdas13 extends Terrain {
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

export class GeeseValdas46 extends Terrain {
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

export class GeeseValdas79 extends Terrain {
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
		[[29, 11], [31, 11], [31, 13], [29, 13]],
		[ [ 29, 38 ], [ 27, 38 ], [ 27, 33 ], [ 29, 33 ]],
		[ [ 31, 33 ], [ 29, 33 ], [ 29, 31 ], [ 31, 31 ]]
	];
	craters = [[24, 15], [38, 10],[ 36, 29 ], [ 22, 34 ]];
}

export class GeeseValdas1012 extends Terrain {
	rectangleFootprints = [
		[[21, 7], [32, 7], [32, 13], [21, 13]],
		[[ 39, 37 ],[ 28, 37 ],[ 28, 31 ],[ 39, 31 ]]
	];
	triangleFootprints = [
		[[15, 5], [17, 10], [8, 13]],
		[[37, 9], [48, 5], [47, 11]],
		[[31, 15], [39, 20], [27, 20]],
		[[ 45, 39 ], [ 43, 34 ], [ 52, 31 ] ],
		[[ 23, 35 ], [ 12, 39 ], [ 13, 33 ] ],
		[[ 29, 29 ], [ 21, 24 ], [ 33, 24 ] ]
	];
	containers = [
		[[7, 23], [12, 23], [12, 25], [7, 25]],
		[[12, 21], [14, 21], [14, 23], [12, 23]],
		[[ 53, 21 ],[ 48, 21 ],[ 48, 19 ], [ 53, 19 ]],
		[[ 48, 23 ],[ 46, 23 ],[ 46, 21 ],[ 48, 21 ]]
	]
	craters = [[21, 17], [17, 29], [ 39, 27 ], [ 43, 15 ]];
}

export class GeeseValdas1315 extends Terrain {
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


export class GeeseValdasII_b extends Terrain {
	rectangleFootprints = [
		footprint10x7(5, 13, 0),
		footprint10x7(15, 35, -30),
		footprint10x7(21, 20, 5),
		footprint10x7(24, 7),
		footprint5x2(11, 28),

		footprint10x7(55,31, 180),
		footprint10x7(45,9, 150),
		footprint10x7(39,24, 185),
		footprint10x7(36,37, 180),
		footprint5x2(49, 16, 180),
	];
	craters = [[12, 3], [34, 10], [48, 41], [26, 34]];
}



export class GeeseValdasII_e extends Terrain {
	rectangleFootprints = [
		footprint10x7(8, 7, -5),
		footprint10x7(11, 23),
		footprint10x7(24, 14, 20),
		footprint10x7(32, 4, 18),
		footprint5x2(21, 6, 26),
		footprint2x2(19, 10, 25),

		footprint10x7(52,37, 175),
		footprint10x7(49,21, 180),
		footprint10x7(36,30, 200),
		footprint10x7(28,40, 198),
		footprint5x2(39,38, 206),
		footprint2x2(41, 34, 205)
	];
	craters = [[19, 18], [17, 41], [41,26], [43,3]];
}

export class GeeseValdasII_i extends Terrain {
	rectangleFootprints = [
		footprint10x7(7, 22, -28),
		footprint10x7(15, 33, -33),
		footprint10x7(20, 22, -35),
		footprint5x2(16, 9),
		footprint2x2(16, 14),
		footprint5x2(24, 8, -35),

		footprint10x7(53,22, 152),
		footprint10x7(45,11, 147),
		footprint10x7(40,22, 145),
		footprint5x2(44,35, 180),
		footprint2x2(44,30, 180),
		footprint5x2(36,36, 145),
	];
	craters = [[9, 6], [23, 15], [51,38], [37,29]];
}



export class GeeseValdasII_o extends Terrain {
	rectangleFootprints = [
		footprint10x7(4, 18, -28),
		footprint10x7(17, 4),
		footprint10x7(21, 19),
		footprint10x7(12, 30, -35),
		footprint2x2(29, 7, -40),
		footprint5x2(30, 9, -40),

		footprint10x7(56,26, 152),
		footprint10x7(43,40, 180),
		footprint10x7(39,25, 180),
		footprint10x7(48,14, 145),
		footprint2x2(31,37, 140),
		footprint5x2(30,35, 140),
	];
	craters = [[17, 18], [28, 41], [43,26], [32,3]];
}

export class GeeseValdasII_r extends Terrain {
	rectangleFootprints = [
		footprint10x7(10, 24, -90),
		footprint10x7(12, 37, -90),
		footprint10x7(24, 30, -90),
		footprint10x7(33, 41, -90),
		footprint5x2(2, 27, -90),
		footprint5x2(7, 25, 0),

		footprint10x7(50,20, -270),
		footprint10x7(48,7, -270),
		footprint10x7(36,14, -270),
		footprint10x7(27,3, -270),
		footprint5x2(58,17, -270),
		footprint5x2(53,19, 180),
	];
	craters = [[20, 26], [21, 14], [40,18], [39,30]];
}



export class GeeseValdasII_s extends Terrain {
	rectangleFootprints = [
		footprint10x7(3, 13, -95),
		footprint10x7(18, 11, -95),
		footprint10x7(35, 12, -90),
		footprint10x7(11, 28, -90),
		footprint10x7(26, 21, -90),

		footprint10x7(57,31, -275),
		footprint10x7(42,33, -275),
		footprint10x7(25,32, -270),
		footprint10x7(49,16, -270),
		footprint10x7(34,23, -270),
	]

	craters = [[7, 32], [18, 16], [53,12], [42,28]];
}

// [[3, 13], [18, 11], [35, 12], [11, 28], [26, 21], [7, 25], [7, 32], [18, 16]].map(([x, y]) => [60-x, 44-y]).join()


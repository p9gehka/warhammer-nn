import { Terrain } from './terrain-common.js';
import {
	GeeseValdas13,
	GeeseValdas46,
	GeeseValdas79,
	GeeseValdas1012,
	GeeseValdas1315
} from './terrain60x44.js';

import {
	ArkunashaRuins,
} from './terrain44x30.js';

class Empty extends Terrain {
	rectangleFootprints = [];
	triangleFootprints = [];
	containers = [];
	craters = [];
}

export const terrain = {
	"empty": Empty,
	"geeseValdas1-3": GeeseValdas13,
	"geeseValdas4-6": GeeseValdas46,
	"geeseValdas7-9": GeeseValdas79,
	"geeseValdas10-12": GeeseValdas1012,
	"geeseValdas13-15": GeeseValdas1315,
	"arkunasha-ruins": ArkunashaRuins,
}

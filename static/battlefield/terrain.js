import { Terrain } from './terrain-common.js';
import {
	GeeseValdas13,
	GeeseValdas46,
	GeeseValdas79,
	GeeseValdas1012,
	GeeseValdas1315,
	GeeseValdasII_b,
	GeeseValdasII_e,
	GeeseValdasII_i,
	GeeseValdasII_o,
	GeeseValdasII_r,
	GeeseValdasII_s,
} from './terrain60x44.js';

import {
	ArkunashaRuins,
	FedrasTemple,
	DalitCity,
	AgrellanFavelas,
	FirecastOutpost,
	StantionFortress
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
	"geeseValdasII-b": GeeseValdasII_b,
	"geeseValdasII-e": GeeseValdasII_e,
	"geeseValdasII-i": GeeseValdasII_i,
	"geeseValdasII-o": GeeseValdasII_o,
	"geeseValdasII-r": GeeseValdasII_r,
	"geeseValdasII-s": GeeseValdasII_s,
	"arkunasha-ruins": ArkunashaRuins,
	"fedras-temple": FedrasTemple,
	"dalit-city": DalitCity,
	"agrellan-favelas": AgrellanFavelas,
	"firecast-outpost": FirecastOutpost,
	"stantion-fortress": StantionFortress,
}

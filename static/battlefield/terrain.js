import { Terrain } from './terrain-common.js';
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
	"arkunasha-ruins": ArkunashaRuins,
	"fedras-temple": FedrasTemple,
	"dalit-city": DalitCity,
	"agrellan-favelas": AgrellanFavelas,
	"firecast-outpost": FirecastOutpost,
	"stantion-fortress": StantionFortress,
}

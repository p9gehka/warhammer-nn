import { sub } from '../vec2.js';

export class Rect {
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	include(x0, y0) {
		const [shiftedX, shifedY]= sub([x0, y0], [this.x, this.y]);
		return 0 < shiftedX && shiftedX < this.width && 0 < shifedY && shifedY < this.height;
	}

	getAllPoints() {
		const points = [];

		for (let x = this.x; x < this.x+this.width; x++) {
			for (let y = this.y; y < this.y+this.height; y++) {
				points.push([x, y]);
			}		
		}
		return points;
	}

}

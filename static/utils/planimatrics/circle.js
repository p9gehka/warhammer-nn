import { len, sub } from '../vec2.js';

export class Circle {
	constructor(x, y, r) {
		this.x = x;
		this.y = y;
		this.r = r;
	}

	include(x0, y0) {
		return len(sub([this.x, this.y], [x0, y0])) < this.r;
	}
}

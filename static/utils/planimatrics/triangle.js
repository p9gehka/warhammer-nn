export class Triangle {
	constructor(x1, y1, x2, y2, x3, y3) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.x3 = x3;
		this.y3 = y3;
	}
	include(x0, y0) {
		if (isNaN(x0) || isNaN(y0)) {
			return false;
		}
		const { x1, y1, x2, y2, x3, y3 } = this;
		const a = (x1 - x0) * (y2 - y1) - (x2 - x1) * (y1 - y0);
		const b = (x2 - x0) * (y3 - y2) - (x3 - x2) * (y2 - y0);
		const c = (x3 - x0) * (y1 - y3) - (x1 - x3) * (y3 - y0);
		const hasNeg = (a < 0) || (b < 0) || (c < 0);
		const hasPos = (a > 0) || (b > 0) || (c > 0);
		return !(hasNeg && hasPos);
	}

	getAllPoints() {
		const points = [];
		for (let x = Math.min(this.x1, this.x2, this.x3); x < Math.max(this.x1, this.x2, this.x3); x++) {
			for (let y = Math.min(this.y1, this.y2, this.y3); y < Math.max(this.y1, this.y2, this.y3); y++) {
				if (this.include(x, y)) {
					points.push([x, y]);
				}
			}
		}
		return points;
	}
}

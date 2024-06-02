export class Drawing {
	fillPath(cb) {
		this.ctx.beginPath();
		cb();
		this.ctx.closePath();
		this.ctx.fill();
	}

	strokePath(cb) {
		this.ctx.beginPath();
		cb();
		this.ctx.closePath();
		this.ctx.stroke();
	}
}

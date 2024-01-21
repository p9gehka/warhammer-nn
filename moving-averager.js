export class MovingAverager {
	constructor(bufferLength) {
		this.buffer = [];
		this._full = false;
		for (let i = 0; i < bufferLength; ++i) {
			this.buffer.push(null);
		}
	}
	isFull() {
		if(this._fill) { return true };
		this._fill = this.buffer.every(v=> v !== null);
		return this._fill;
	}
	append(x) {
		this.buffer.shift();
		this.buffer.push(x);
	}

	average() {
		return this.buffer.reduce((x, prev) => x + prev) / this.buffer.length;
	}
}

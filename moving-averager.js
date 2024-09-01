export class MovingAverager {
	constructor(bufferLength) {
		this.bufferLength = bufferLength;
		this.empty();
	}
	isFull() {
		return this.length === this.bufferLength
	}
	append(x) {
		this.buffer.shift();
		this.buffer.push(x);
		if (this.length < this.bufferLength) {
			this.length++;
		}
	}

	average() {
		return this.buffer.reduce((x, prev) => x + prev) / this.length;
	}
	
	empty() {
		this.length = 0;
		this.buffer = [];
		for (let i = 0; i < this.bufferLength; ++i) {
			this.buffer.push(null);
		}
	}
}

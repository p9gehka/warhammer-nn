import { getRandomInteger } from '../utils/index.js';

export class RandomAgent {
	constructor(orders, getInputFunction) {
		this.orders = orders;
		this.getInputFunction = getInputFunction;
	}
	playStep(state) {
		const orderIndex = getRandomInteger(0, this.orders.length);
		return { order: this.orders[orderIndex], orderIndex, estimate: 0 };
	}
	getInput(state) {
		return this.getInputFunction(state)
	}
	load() {}
}

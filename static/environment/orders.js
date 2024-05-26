import { angleToVec2, round, add } from '../utils/vec2.js';
import { BaseAction } from './warhammer.js';
export const Action = { ...BaseAction }

/* `←``↑``→``↓``↖``↗``↘``↙`*/
const distances = [2, 6];
const distancesDiagonal = [2];
const distancesDiagonalExpense = [2];
const angles = [0, 90, 180, 270];

export class Orders {
	orders = null;
	constructor() {}
	getOrders() {
		if (this.orders !== null) {
			return this.orders;
		}
		this.orders = {
			[Action.NextPhase]: [],
			nextPhaseIndexes: [],
			[Action.Move]: [],

			moveIndexes: [],

			all: [],
		};

		this.orders[Action.NextPhase] = [{ action: Action.NextPhase }];
		this.orders[Action.NextPhase].forEach((order) => {
			this.orders.nextPhaseIndexes.push(this.orders.all.length);
			this.orders.all.push(order);
		});

		angles.forEach((angle, i) => {
			for (let distance of distances) {
				this.orders[Action.Move].push({ action: Action.Move, vector: round(angleToVec2(distance, angle)), expense: distance });
			}

			distancesDiagonal.forEach((distance, ii) => {
				const vector1 = angleToVec2(distance, angle);
				const vector2 = angleToVec2(distance, angles[(i+1) % angles.length]);
				const vector = round(add(vector1, vector2));
				this.orders[Action.Move].push({ action: Action.Move, vector, expense: distancesDiagonalExpense[ii] });
			});
		});

		this.orders[Action.Move].forEach((order) => {
			this.orders.moveIndexes.push(this.orders.all.length);
			this.orders.all.push(order);
		});
		return this.orders;
	}
}

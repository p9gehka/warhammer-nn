import { angleToVec2, round, add } from '../utils/vec2.js';
import { BaseAction } from './warhammer.js';
export const Action = {
	Select: 'SELECT',
	SetTarget: 'SET_TARGET',
	...BaseAction
}

/* `←``↑``→``↓``↖``↗``↘``↙`*/
const distances = [1, 2, 3, 6];
const distancesDiagonal = [1, 2, 4];
const distancesDiagonalExpense = [2, 3, 6];
const angles = [0, 90, 180, 270];

export class Orders {
	orders = null;
	constructor() {}
	getOrders() {
		if (this.orders !== null) {
			return this.orders;
		}
		this.orders = {
			nextPhaseIndex: 0,
			doneIndex: 1,
			[Action.NextPhase]: [{ action: Action.NextPhase }],
			[Action.Move]: [],
			[Action.Select]: [],
			[Action.DiscardSecondary]: [{ action: Action.DiscardSecondary, id: 0 }, { action: Action.DiscardSecondary, id: 1 }],
			moveIndexes: [],
			selectIndexes: [],
			discardSecondaryIndex: [],
			setTargetIndex: [],
			all: []
		}
		this.orders.all.push({ action: Action.NextPhase });
		this.orders.all.push({ action: Action.Done });

		this.orders[Action.Select] = Array(30).fill().map((_, id) => ({ action: 'SELECT', id }));

		this.orders[Action.Select].forEach((order) => {
			this.orders.selectIndexes.push(this.orders.all.length);
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

		this.orders[Action.DiscardSecondary].forEach((order) => {
			this.orders.discardSecondaryIndex.push(this.orders.all.length);
			this.orders.all.push(order);
		});

		this.orders[Action.SetTarget] = Array(30).fill().map((_, id) => ({ action: 'SET_TARGET', id }));

		this.orders[Action.SetTarget].forEach((order) => {
			this.orders.setTargetIndex.push(this.orders.all.length);
			this.orders.all.push(order);
		});
		return this.orders;
	}
}

import { angleToVec2, round } from '../utils/vec2.js';
import { BaseAction } from './warhammer.js';
export const Action = { ...BaseAction }

/* `←``↑``→``↓``↖``↗``↘``↙`*/
const distances = [1, 2, 3, 6];
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
			[Action.Move]: [],
			moveIndexes: [],
			separate_move_nextPhase: [],
			all: [],
		};

		this.orders[Action.NextPhase] = [{ action: Action.NextPhase }];
		this.orders[Action.NextPhase].forEach((order) => {
			this.orders.c.push(this.orders.all.length);
			this.orders.all.push(order);
		});

		for (let distance of distances) {
			for (let angle of angles) {
				this.orders[Action.Move].push({ action:Action.Move, vector: round(angleToVec2(distance, angle)) });
			}
		}

		this.orders[Action.Move].forEach((order) => {
			this.orders.moveIndexes.push(this.orders.all.length);
			this.orders.all.push(order);
		});
		return this.orders;
	}
}

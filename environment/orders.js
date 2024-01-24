import { angleToVec2, round, add } from '../static/utils/vec2.js';
import { Action } from './player-environment.js';
import { getTF } from '../dqn/utils.js';

/* `←``↑``→``↓``↖``↗``↘``↙`*/
const distances = [1, 2, 3, 6];
const distancesDiagonal = [1, 2, 4];
const angles = [0, 90, 180, 270];
const tf = await getTF();

export class Orders {
	orders = null;
	constructor(models, targets) {
		this.models = Array(models).fill(0).map((v, i) => i);
		this.targets = Array(targets).fill(0).map((v, i) => i);
	}
	getOrders() {
		if (this.orders !== null) {
			return this.orders;
		}
		const models = this.models;
		const targets = this.targets;
		this.orders = {
			nextPhaseIndex: 0,
			[Action.NextPhase]: [{ action: Action.NextPhase }],
			[Action.Move]: [],
			moveIndexes: [],
			all: []
		};

		angles.forEach((angle, i) => {
			for (let distance of distances) {
				this.orders[Action.Move].push({ action: Action.Move, vector: round(angleToVec2(distance, angle)) });
			}
			for (let distance of distancesDiagonal) {
				const vector1 = angleToVec2(distance, angle);
				const vector2 = angleToVec2(distance, angles[(i+1) % angles.length]);
				const vector = round(add(vector1, vector2));
				this.orders[Action.Move].push({ action: Action.Move, vector });
			}
		});
		console.log(this.orders[Action.Move])
		this.orders.moveIndexes.push(this.orders.nextPhaseIndex);
		this.orders.all.push(...this.orders[Action.NextPhase]);

		this.orders[Action.Move].forEach((order) => {
			this.orders.moveIndexes.push(this.orders.all.length);
			this.orders.all.push(order);
		});
		return this.orders;
	}
}
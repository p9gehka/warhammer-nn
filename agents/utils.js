import { angleToVec2, round2 } from '../static/utils/vec2.js';
import { Action } from '../environment/player-environment.js';
import { getTF } from '../dqn/utils.js';

const distances = [0.25, 0.5, 0.75, 1];
const angles = [0, 45, 90, 180, 225 , 270, 315];
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
			[Action.Select]: [],
			[Action.Move]: [],
			selectIndexes: [],
			moveIndexes: [],
			selectAndMoveIndexes: [],
			all: []
		}

		for (let id of models) {
			this.orders[Action.Select].push({ action: Action.Select, id });
		}


		for (let distance of distances) {
			for (let angle of angles) {
				this.orders[Action.Move].push({ action:Action.Move, vector: round2(angleToVec2(distance, angle)) });
			}
		}

		this.orders.all.push(...this.orders[Action.NextPhase]);
		this.orders.selectIndexes.push(this.orders.nextPhaseIndex)
		this.orders.moveIndexes.push(this.orders.nextPhaseIndex)
		this.orders.selectAndMoveIndexes.push(this.orders.nextPhaseIndex);

		for (let action of [Action.Select, Action.Move]){
			this.orders[action].forEach((order) => {
				if (action === Action.Select) {
					this.orders.selectIndexes.push(this.orders.all.length);
					this.orders.selectAndMoveIndexes.push(this.orders.all.length);
				}

				if (action === Action.Move) {
					this.orders.moveIndexes.push(this.orders.all.length)
					this.orders.selectAndMoveIndexes.push(this.orders.all.length);
				}

				this.orders.all.push(order);
			});
		}
		return this.orders;
	}
}

export function getStateTensor(state, h, w, channels) {
	const c = channels.length;
	const numExamples = state.length;

	let buffer = tf.buffer([numExamples, h, w, c]);
	for (let n = 0; n < numExamples; ++n) {
		if (state[n] === null) {
			continue;
		}
		channels.forEach((channel, i) => {
			for (let entity in channel) {
				if (state[n][entity] === undefined) {
					return
				}
				const enitities = state[n][entity].forEach(yx => {
					buffer.set(channel[entity], n, yx[0], yx[1], i);
				})
			}
		});
	}
	return buffer.toTensor();
}

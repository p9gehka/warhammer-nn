import * as tf from '@tensorflow/tfjs-node';
import { angleToVec2, round2 } from '../static/utils/vec2.js';
import { Action, channels } from '../environment/player-environment.js';

const distances = [0.25, 0.5, 0.75, 1];
const angles = [0, 45, 90, 180, 225 , 270, 315];

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
			[Action.NextPhase]: [{ action: Action.NextPhase }],
			[Action.Select]: [],
			[Action.Move]: [],
			[Action.Shoot]: [],
			nextPhaseIndex: 0,
			selectIndexes: [],
			moveIndexes: [],
			selectAndMoveIndexes: [],
			shootIndexes: [],
			selectAndShootIndexes: [],
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

		for (let target of targets) {
			this.orders[Action.Shoot].push({ action: Action.Shoot, target });
		}

		this.orders.all.push(...this.orders[Action.NextPhase]);
		this.orders.selectIndexes.push(0)
		this.orders.moveIndexes.push(0)
		this.orders.shootIndexes.push(0)
		this.orders.selectAndMoveIndexes.push(0);
		this.orders.selectAndShootIndexes.push(0);

		for (let action of [Action.Select, Action.Move, Action.Shoot]){
			this.orders[action].forEach((order) => {
				if (action === Action.Select) {
					this.orders.selectIndexes.push(this.orders.all.length);
					this.orders.selectAndMoveIndexes.push(this.orders.all.length);
					this.orders.selectAndShootIndexes.push(this.orders.all.length);
				}

				if (action === Action.Move) {
					this.orders.moveIndexes.push(this.orders.all.length)
					this.orders.selectAndMoveIndexes.push(this.orders.all.length);
				}

				if (action === Action.Shoot) {
					this.orders.shootIndexes.push(this.orders.all.length)
					this.orders.selectAndShootIndexes.push(this.orders.all.length)
				}
				this.orders.all.push(order);
			});
		}

		return this.orders;
	}
}

export function getStateTensor(state, h, w, c) {
  const numExamples = state.length;
  let buffer = tf.buffer([numExamples, h, w, c]);

  for (let n = 0; n < numExamples; ++n) {
    if (state[n] == null) {
      continue;
    }
 
    channels.forEach((channel, i) => {
    	for (let entity in channel) {
    		if (!state[n][entity]) {
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
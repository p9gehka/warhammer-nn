import * as tf from '@tensorflow/tfjs-node';
import { angleToVec2, round2 } from '../static/utils/vec2.js';
import { Action, channels } from '../environment/player-environment.js';
const models = [0, 1];
const distances = [0.25, 0.5, 0.75, 1];
const angles = [0, 45, 90, 180, 225 , 270, 315];

const targets = [0, 1];

let orders = null;
export function getOrders() {
	if (orders !== null) {
		return orders;
	}
	orders = {
		[Action.NextPhase]: [{ action: Action.NextPhase }],
		[Action.Select]: [],
		[Action.Move]: [],
		[Action.Shoot]: [],
		nextPhaseIndex: 0,
		selectAndMove: [],
		selectAndShoot: [],
		nextPhaseIndexesArgMax: [],
		selectIndexes: [],
		selectIndexesArgMax: [],
		selectAndMoveIndexes: [],
		selectAndMoveIndexesArgMax: [],
		selectAndShootIndexes: [],
		selectAndShootIndexesArgMax: [],
		all: []
	}

	for (let id of models) {
		orders[Action.Select].push({ action: Action.Select, id });
	}


	for (let distance of distances) {
		for (let angle of angles) {
			orders[Action.Move].push({ action:Action.Move, vector: round2(angleToVec2(distance, angle)) });
		}
	}

	for (let target of targets) {
		orders[Action.Shoot].push({ action: Action.Shoot, target });
	}

	orders.all.push(...orders[Action.NextPhase]);
	orders.selectIndexes.push(0)
	orders.selectAndMoveIndexes.push(0);
	orders.selectAndShootIndexes.push(0);

	for (let action of [Action.Select, Action.Move, Action.Shoot]){
		orders[action].forEach((order) => {
			if (action === Action.Select) {
				orders.selectIndexes.push(orders.all.length);
				orders.selectAndMoveIndexes.push(orders.all.length);
				orders.selectAndShootIndexes.push(orders.all.length);
			}

			if (action === Action.Move) {
				orders.selectAndMoveIndexes.push(orders.all.length);
			}

			if (action === Action.Shoot) {
				orders.selectAndShootIndexes.push(orders.all.length)
			}
			orders.all.push(order);
		});
	}

	orders.selectAndMove = [...orders[Action.NextPhase], ...orders[Action.Select], ...orders[Action.Move]];
	orders.selectAndShoot = [...orders[Action.NextPhase], ...orders[Action.Select], ...orders[Action.Shoot]];

	orders.nextPhaseIndexesArgMax = Array(orders.all.length).fill(-Infinity);
	orders.selectIndexesArgMax = Array(orders.all.length).fill(-Infinity);
	orders.selectAndMoveIndexesArgMax = Array(orders.all.length).fill(-Infinity);
	orders.selectAndShootIndexesArgMax = Array(orders.all.length).fill(-Infinity);

	orders.nextPhaseIndexesArgMax[orders.nextPhaseIndex] = 0;
	orders.selectIndexes.forEach(i => orders.selectIndexesArgMax[i] = 0);
	orders.selectAndMoveIndexes.forEach(i => orders.selectAndMoveIndexesArgMax[i] = 0);
	orders.selectAndShootIndexes.forEach(i => orders.selectAndShootIndexesArgMax[i] = 0)

	return orders;
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
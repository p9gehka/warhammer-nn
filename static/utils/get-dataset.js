import { Warhammer } from '../environment/warhammer.js';
import { MoveAgent } from '../agents/move-agent/move-center-agent.js';
import { getStateTensor } from '../utils/get-state-tensor.js';
import { getTF } from './get-tf.js';
import { getRandomInteger } from './index.js';
import { eq } from './vec2.js';

import gameSettings from '../settings/game-settings.json' assert { type: 'json' };
import allBattlefields from '../settings/battlefields.json' assert { type: 'json' };

import config from '../game.config.json' assert { type: 'json' };

let battlefields = config.battlefields.length > 0 ? filterObjByKeys(allBattlefields, config.battlefields) : allBattlefields;

const tf = await getTF();

function gameToFeaturesAndLabel(record) {
	return tf.tidy(() => {
		const [input, orderIndex] = record;
		const features = getStateTensor([input], MoveAgent.settings.height, MoveAgent.settings.width, MoveAgent.settings.channels).squeeze();
		const label = tf.oneHot(tf.scalar(orderIndex, 'int32'), MoveAgent.settings.orders.length);
		return {xs: features, ys: label};
	});
}

function getRandomStartPosition(exclude, battlefield) {
	while(true) {
		const axis = getRandomInteger(0, 2);
		const edge = getRandomInteger(0, 2);

		const result = [0, 0];
		const padding = (getRandomInteger(0, 13) * (edge === 1 ? - 1 : 1));
		result[axis]= edge * battlefield.size[axis] - 1 + padding;
		result[(axis+1)%2] = getRandomInteger(0, battlefield.size[(axis+1)%2]);
		if (!exclude.some(pos => eq(result, pos))) {
			return result;
		}
	}
}

export function getRawDataset() {
	const env = new Warhammer({ gameSettings, battlefields, getRandomStartPosition });
	const agent = new MoveAgent();
	let nsteps = 0;
	function getStateAndAnswer() {
		const state = env.getState();
		const selected = env.players[state.player].models[0];
		const { orderIndex, order } = agent.playStep(state);
		env.step({ ...order, id: selected });
		if (nsteps === 1 || env.getState().done) {
			env.reset();
			env.models[selected].stamina = getRandomInteger(0, 10);
			nsteps=0;
		}
		
		nsteps++;
		return [agent.getInput(state), orderIndex];
	}
	function* getStateAndAnswerGeneratorFn() {
		while(true) {
			yield getStateAndAnswer();
		}
	}

	const myGeneratorDataset = tf.data.generator(getStateAndAnswerGeneratorFn);

	return myGeneratorDataset//.map(gameToFeaturesAndLabel);
}

export function getDataset() {
	return getRawDataset().map(gameToFeaturesAndLabel);
}

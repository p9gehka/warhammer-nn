import { Warhammer } from '../environment/warhammer.js';
import { MoveAgent } from '../agents/move-agent/move-center-agent.js';
import { getStateTensor1 } from '../utils/get-state-tensor.js';
import { getTF } from './get-tf.js';
import { getRandomInteger } from './index.js';
import { eq } from './vec2.js';

import gameSettings from '../settings/game-settings.json' assert { type: 'json' };
import allBattlefields from '../settings/battlefields.json' assert { type: 'json' };

import config from '../game.config.json' assert { type: 'json' };

let battlefields = config.battlefields.length > 0 ? filterObjByKeys(allBattlefields, config.battlefields) : allBattlefields;

const tf = await getTF();

export function gameToFeaturesAndLabel(record) {
	return tf.tidy(() => {
		const [input, orderIndex] = record;
		const features = getStateTensor1(input, MoveAgent.settings.width, MoveAgent.settings.height , MoveAgent.settings.channels);
		const label = tf.oneHot(tf.scalar(orderIndex, 'int32'), MoveAgent.settings.orders.length);
		return {xs: features, ys: label};
	});
}

export function getRandomStartPosition(exclude, battlefield) {
	const pad = -4;
	const paddingX = (battlefield.size[0]-battlefield.size[1] + pad) / 2;
	const paddingY = 0;
	while(true) {
		let x1 = getRandomInteger(0, paddingX) + (battlefield.size[1] + paddingX - pad) * getRandomInteger(0, 2);
		let y1 = getRandomInteger(0 + paddingY, battlefield.size[1] - paddingY);
		if (!exclude.some(pos => eq([x1, y1], pos))) {
			return [x1, y1];
		}
	}
}

export function getRawDataset() {
	const env = new Warhammer({ gameSettings, battlefields, getRandomStartPosition });
	const agent = new MoveAgent();

	function getStateAndAnswer() {
		const state = env.getState();
		const selected = env.players[state.player].models[0];
		const { orderIndex, order } = agent.playStep(state);
		env.step({ ...order, id: selected });
		
		env.reset();
		env.models[selected].stamina = getRandomInteger(0, 10);
		const input = agent.getInput(state)
		return [input, orderIndex];
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

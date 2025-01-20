import { Warhammer, BaseAction } from '../environment/warhammer.js';
import { MoveAgent } from '../agents/move-agent/move-to-object-agent.js';
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
		const features = getStateTensor1(input, MoveAgent.settings.width, MoveAgent.settings.height, MoveAgent.settings.channels);
		const label = tf.oneHot(tf.scalar(orderIndex, 'int32'), MoveAgent.settings.orders.length);
		return { xs: { input1: features[0], input2: features[1] }, ys: label};
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

export function getRawDataset(argenv, argagent) {
	const env = argenv ?? new Warhammer({ gameSettings, battlefields });
	const agent = argagent ?? new MoveAgent();

	function getStateAndAnswer() {	
		env.reset();
		const selectTurn = [0, 2, 4, 6, 8];

		let choosedTurn = selectTurn[getRandomInteger(0, selectTurn.length)];
		choosedTurn = getRandomInteger(0, 10);
		if (choosedTurn !== 0) {
			env.turn = choosedTurn - 1;
			env.step({ action: BaseAction.NextPhase });
		}

		let state = env.getState();
		const { models: playerModels } = env.players[state.player];
		const playerModelSelected = getRandomInteger(0, playerModels.length);
		const selected = playerModels[playerModelSelected];
		env.models[selected].stamina = getRandomInteger(1, 10);
		for (let i = 0; i < selected; i++) {
			env.models[i].stamina = 0;
		}

		state = env.getState();
		const { orderIndex, order }  = agent.playStep(state, { selected: playerModelSelected });
		env.step({ ...order, id: selected });

		const input = agent.getInput(state, { selected: playerModelSelected })
		return [input, orderIndex];
	}
	function* getStateAndAnswerGeneratorFn() {
		while(true) {
			yield getStateAndAnswer();
		}
	}

	const myGeneratorDataset = tf.data.generator(getStateAndAnswerGeneratorFn);

	return myGeneratorDataset;
}

export function getDataset() {
	return getRawDataset().map(gameToFeaturesAndLabel);
}

import { Warhammer } from '../environment/warhammer.js';
import { MoveAgent } from '../agents/move-agent/move-agent60x44.js';
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

export function getStartPosition(env, playerId, exclude, lastPosition) {
	let tries = 0;
	const deploymentPoints = env.deploymentZonePoints[playerId];
	while(true) {
		let x, y;
		if (lastPosition === undefined) {
			x = getRandomInteger(0, env.battlefield.size[0]);
			y = getRandomInteger(0, env.battlefield.size[1]);
		} else {
			const padding = Math.floor(tries / 4)
			x = lastPosition[0] + getRandomInteger(0, 6 + padding) - (3 + Math.floor(padding/2));
			y = lastPosition[1] + getRandomInteger(0, 6 + padding) - (3 + Math.floor(padding/2));
		}
		if (!exclude.some(pos => eq([x, y], pos)) && 0 <= x && x < env.battlefield.size[0] && 0 <= y && y < env.battlefield.size[1]) {
			return [x, y];
		}
		tries++;
	}
}

export function getRawDataset(argenv, argagent) {
	const env = argenv ?? new Warhammer({ gameSettings, battlefields, getStartPosition });
	const agent = argagent ?? new MoveAgent();

	function getStateAndAnswer() {	
		env.reset();
		const selectRounds = [0, 2, 4, 6, 8]
		env.turn = selectRounds[getRandomInteger(0, selectRounds.length)];
		let state = env.getState();
		const { models: playerModels } = env.players[state.player];
		const playerModelSelected = getRandomInteger(0, playerModels.length);
		const selected = playerModels[playerModelSelected];
		env.models[selected].stamina = getRandomInteger(0, 10);
		for (let i = 0; i < selected; i++) {
			env.models[i].stamina = 0;
		}

		state = env.getState();
		const { orderIndex, order } = agent.playStep(state, { selected: playerModelSelected });
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

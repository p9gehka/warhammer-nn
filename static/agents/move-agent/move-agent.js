import { getStateTensor } from '../../utils/get-state-tensor.js';
import { getTF } from '../../utils/get-tf.js';
import { moveOrders } from './move-orders.js';
import { Channel1Name, Channel3Name } from '../../environment/nn-input.js';
import { getInput } from '../../environment/nn-input.js';
import { getRandomInteger } from '../../utils/index.js';
import { eq } from '../../utils/vec2.js';

const tf = await getTF();

function staminaNot0(state, playerState) {
	const input = getInput(state, playerState);
	const selected = input[Channel3Name.Order0][0];
	return !input[Channel1Name.Stamina0].some(pos => eq(pos, selected));
}

class RandomAgent {
	constructor() {
		this.orders = moveOrders;
	}
	playStep(state, playerStates) {
		const playerState = playerStates[0];
		const input = getInput(state, playerState);
		const selected = input[Channel3Name.Order0][0];
		let orderIndex = 0; 
		if (staminaNot0(state, playerState)) {
			orderIndex = getRandomInteger(0, this.orders.length);
		}
		return playerStates.map(() => ({ order: this.orders[orderIndex], orderIndex, estimate: 0 }));
	}
	getInput(state, playerState) {
		return getInput(state, playerState)
	}
}

export class MoveAgentBase {
	fillAgent = new RandomAgent();
	orders = moveOrders;
	async load() {
		const staticPath = typeof window !== 'undefined' ? '/' : 'file://' + 'static/';
		const loadPath = staticPath + `agents/move-agent/.model${this.width}x${this.height}x${this.channels.length}/model.json`;
		this.onlineNetwork = await tf.loadLayersModel(loadPath);
	}
	playStep(state, playerStates) {
		if (this.onlineNetwork === undefined) {
			return this.fillAgent.playStep(state, playerStates);
		}
		const { orders, height, width, channels } = this;
		const inputs = playerStates.map((playerState, i) => getInput(state, playerState));
		let orderIndexes = 0;
		let estimates = 0;

		tf.tidy(() => {
			const inputTensor = getStateTensor(inputs, width, height, channels);
			const predictions = this.onlineNetwork.predict(inputTensor);
			orderIndexes = predictions.argMax(-1).arraySync();
			estimates = predictions.max(-1).arraySync();
		});
		return orderIndexes.map((orderIndex, i) => ({ order: this.orders[orderIndex], orderIndex, estimate: estimates[i] }));
	}
	getRandomAvailableOrderIndex(state, playerState) {
		const input = getInput(state, playerState);
		const selected = input[Channel3Name.Order0][0];
		let orderIndex = 0; 
		if (staminaNot0(state, playerState)) {
			orderIndex = getRandomInteger(0, this.orders.length);
		}
		return orderIndex;
	}
	printStateTensor() {
		const input = this.getInput();
		const stateTensor = getStateTensor([input], this.width, this.height, this.channels);
		console.log('*************************');
		console.log(stateTensor.arraySync().map(v => v.map(c=> c.join('|')).join('\n')).join('\n'));
		console.log('*************************');
	}
	getInput(state, playerState) {
		return getInput(state, playerState)
	}
}
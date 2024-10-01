import { getStateTensor } from '../../utils/get-state-tensor.js';
import { getTF } from '../../utils/get-tf.js';
import { moveOrders } from './move-orders.js';
import { Channel1Name, Channel3Name } from '../../environment/nn-input.js';
import { getInput } from '../../environment/nn-input.js';
import { getRandomInteger } from '../../utils/index.js';
import { eq } from '../../utils/vec2.js';

const tf = await getTF();

class RandomAgent {
	constructor() {
		this.orders = moveOrders;
	}
	playStep(state) {
		const orderIndex = getRandomInteger(0, this.orders.length);
		return { order: this.orders[orderIndex], orderIndex, estimate: 0 };
	}
	getInput(state, playerState) {
		return getInput(state, playerState)
	}
}

export class MoveAgentBase {
	fillAgent = new RandomAgent();
	orders = moveOrders;
	async load() {
		const loadPath = 'file://' + 'static/' + `agents/move-agent/.model${this.width}x${this.height}x${this.channels.length}/model.json`;
		this.onlineNetwork = await tf.loadLayersModel(loadPath);
	}
	playStep(state, playerState) {
		if (this.onlineNetwork === undefined) {
			return this.fillAgent.playStep(state);
		}
		const { orders, height, width, channels } = this;
		const input = getInput(state, playerState);
		const selected = input[Channel3Name.Order0][0];
		if(isNaN(selected[0])) {
			console.log('isNan(selected[0]!!!!');
		}
		let orderIndex = 0;
		let estimate = 0;

		if (input[Channel1Name.Stamina0].some(pos => eq(pos, selected))) {
			orderIndex = 0;
		} else {
			tf.tidy(() => {
				const inputTensor = getStateTensor([input], width, height, channels);
				const prediction = this.onlineNetwork.predict(inputTensor);
				estimate = prediction.max(-1).dataSync()[0];
				orderIndex = prediction.argMax(-1).dataSync()[0];
			});
		}

		return { order: this.orders[orderIndex], orderIndex, estimate };
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

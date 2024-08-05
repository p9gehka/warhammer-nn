import { getStateTensor } from '../../utils/get-state-tensor.js';
import { getTF } from '../../utils/get-tf.js';
import { Orders } from '../../environment/orders.js';
import { Channel1Name } from '../../environment/nn-input.js';
import { getInput } from '../../environment/nn-input.js';
import { getRandomInteger } from '../../utils/index.js';

const tf = await getTF();

class RandomAgent {
	constructor() {
		this.orders = new Orders().getOrders();
	}
	playStep(state) {
		const orderIndex = getRandomInteger(0, this.orders.all.length);
		return { order: this.orders.all[orderIndex], orderIndex, estimate: 0 };
	}
	getInput(state) {
		return getInput(state)
	}
}

export class MoveAgentBase {
	fillAgent = new RandomAgent();
	async load() {
		const loadPath = 'file://' + 'static/' + `agents/move-agent/.model${this.width}x${this.height}x${this.channels.length}/model.json`;
		this.onlineNetwork = await tf.loadLayersModel(loadPath);
	}
	playStep(state) {
		if (this.onlineNetwork === undefined) {
			return this.fillAgent.playStep(state);
		}
		const { orders, height, width, channels } = this;
		const input = getInput(state);

		let orderIndex = 0;
		let estimate = 0;

		if (input[Channel1Name.Stamina0].length > 0) {
			orderIndex = 0;
		} else {
			tf.tidy(() => {
				const inputTensor = getStateTensor([input], height, width, channels);
				const prediction = this.onlineNetwork.predict(inputTensor);
				estimate = prediction.max(-1).dataSync()[0];
				orderIndex = prediction.argMax(-1).dataSync()[0];
			});
		}

		return { order: this.orders.all[orderIndex], orderIndex, estimate };
	}

	printStateTensor() {
		const input = this.getInput();
		const stateTensor = getStateTensor([input], this.height, this.width, this.channels);
		console.log('*************************');
		console.log(stateTensor.arraySync().map(v => v.map(c=> c.join('|')).join('\n')).join('\n'));
		console.log('*************************');
	}
	getInput(state) {
		return getInput(state)
	}
}

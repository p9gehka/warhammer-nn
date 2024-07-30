import { getStateTensor } from '../../utils/get-state-tensor.js';
import { getTF } from '../../utils/get-tf.js';
import { Orders } from '../../environment/orders.js';
import { Channel1Name } from '../../environment/nn-input.js';
import { channels, getInput } from '../../environment/nn-input.js';

const tf = await getTF();

export class MoveAgent {
	autoNext = true;
	width = 44;
	height = 30;
	channels = channels;
	constructor() {
		this.orders = new Orders().getOrders();
	}
	async load() {
		this.onlineNetwork = await tf.loadLayersModel('file://' + 'static/' + 'agents/move-agent44x30/.model/model.json');
	}
	playStep(state) {
		const { orders, height, width, channels } = this;
		const input = getInput(state);
		const inputTensor = getStateTensor([input], height, width, channels);

		let orderIndex = 0;
		let estimate = 0;

		if (this.autoNext && input[Channel1Name.Stamina0].length > 0 && this.onlineNetwork === undefined) {
			orderIndex = 0;
		} else {
			tf.tidy(() => {
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
}

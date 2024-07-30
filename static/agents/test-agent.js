import { getStateTensor } from '../utils/get-state-tensor.js';
import { getTF } from '../utils/get-tf.js';
import { Action } from '../environment/orders.js';
import { Channel1Name } from '../environment/nn-input.js';

const tf = await getTF();

export class TestAgent {
	autoNext = true;

	constructor(config = {}) {
		const { nn } = config;
		this.onlineNetwork = nn;
	}

	playStep(input, inputTensor) {
		let orderIndex = 0;
		let estimate = 0;

		if (this.autoNext && input[Channel1Name.Stamina0].length > 0) {
			orderIndex = 0;
		} else {
			tf.tidy(() => {
				const prediction = this.onlineNetwork.predict(inputTensor);
				estimate = prediction.max(-1).dataSync()[0];
				orderIndex = prediction.argMax(-1).dataSync()[0];
			});
		}
		return orderIndex;
	}
	reset() {
		this.game.reset();
	}

	awarding() {
		this.game.awarding();
	}
}

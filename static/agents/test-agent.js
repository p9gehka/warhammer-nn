import { getStateTensor } from '../utils/get-state-tensor.js';
import { getTF } from '../utils/get-tf.js';
import { GameAgent } from './game-agent0.1.js';
import { Action } from '../environment/orders.js';
import { Channel1Name, Channel3Name } from '../environment/nn-input.js';
import { eq } from '../utils/vec2.js'

const tf = await getTF();

export class TestAgent {
	autoNext = true;

	constructor(game, config = {}) {
		const { nn } = config;
		this.game = game;
		this.gameAgent = new GameAgent(game);
		this.onlineNetwork = nn;
	}

	playStep() {
		const { orders, height, width, channels } = this.game;
		const input = this.game.getInput();
		const selected = input[Channel3Name.Selected][0];
		let orderIndex = 0;
		let estimate = 0;

		if (this.autoNext && (input[Channel1Name.Stamina0].some(pos => eq(pos, selected)) || isNaN(selected[0]))) {
			orderIndex = 0;
		} else {
			tf.tidy(() => {
				const inputTensor = getStateTensor([input], height, width, channels);
				const prediction = this.onlineNetwork.predict(inputTensor);
				estimate = prediction.max(-1).dataSync()[0];
				orderIndex = prediction.argMax(-1).dataSync()[0];
			});
		}

		const order = orders.all[orderIndex];
		let [order_, state ,reward] = this.game.step(order);

		if (order.action === Action.NextPhase) {
			reward += this.game.primaryReward();
		}

		return [order_, state, reward, { index: orderIndex, estimate: estimate.toFixed(3) }];
	}
	reset() {
		this.game.reset();
	}

	awarding() {
		this.game.awarding();
	}
}

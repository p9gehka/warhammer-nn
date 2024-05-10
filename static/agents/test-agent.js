import { getStateTensor } from '../utils/get-state-tensor.js';
import { getTF } from '../utils/get-tf.js';
import { GameAgent } from './game-agent0.1.js';
import { Action } from '../environment/orders.js';

const tf = await getTF();

export class TestAgent {
	stepAttemps = 0;
	stepAttempsLimit = 40;
	constructor(game, config = {}) {
		const { nn } = config;
		this.game = game;
		this.gameAgent = new GameAgent(game);
		this.onlineNetwork = nn;
	}

	playStep() {
		const input = this.game.getInput();
		let index = 0;
		let estimate = 0;
		tf.tidy(() => {
			const inputTensor = getStateTensor([input], this.game.height, this.game.width, this.game.channels);
			const prediction = this.onlineNetwork.predict(inputTensor);
			estimate = prediction.max(-1).dataSync()[0];
			index = prediction.argMax(-1).dataSync()[0];
		});

		if (this.stepAttemps > this.stepAttempsLimit) {
			this.game.env.end();
		}

		let [order_, state,reward] = this.game.step(order);
		if (order.action === Action.NextPhase) {
			reward += this.game.primaryReward()
		}

		return [order_, state, reward, { index, estimate: estimate.toFixed(3) }];
	}
	reset() {
		this.stepAttemps = 0;
		this.game.reset();
	}

	awarding() {
		this.game.awarding();
	}
}

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
		this.skipPhase = false;
	}

	playStep() {
		const input = this.game.getInput();
		const initState = this.game.env.getState();
		const { selected } = this.game.getState();
		let orderIndex = 0;
		let estimate = 0;
		const { height, width, channels, orders } = this.game;

		if (this.skipPhase) {
			orderIndex = orders.moveIndexes[0];
			this.skipPhase = false;
		} else {
			tf.tidy(() => {
				const inputTensor = getStateTensor([input], height, width, channels);
				const prediction = this.onlineNetwork.predict(inputTensor);
				estimate = prediction.max(-1).dataSync()[0];
				orderIndex = prediction.argMax(-1).dataSync()[0];
			});
		}

		this.stepAttemps++;
		if (this.stepAttemps > this.stepAttempsLimit) {
			this.game.env.end();
		}

		let [order_, state , reward] = this.game.step(orders.all[orderIndex]);

		return [order_, state, reward, { index: orderIndex, estimate: estimate.toFixed(3) }];
	}
	reset() {
		this.stepAttemp = 0;
		this.game.reset();
		this.skipPhase = false;
	}

	awarding() {
		this.game.awarding();
	}
}

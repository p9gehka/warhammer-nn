import { getStateTensor } from '../static/utils/get-state-tensor.js';
import { getTF } from '../static/utils/get-tf.js';
import { GameAgent } from './game-agent0.1.js';
const tf = await getTF();

export class TestAgent {
	constructor(game, config = {}) {
		const { nn } = config;
		this.game = game;
		this.gameAgent = new GameAgent(game);
		this.onlineNetwork = nn[0];
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
		const stepResult = this.game.step(this.game.orders.all[index]);
		return [...stepResult, { index, estimate: estimate.toFixed(3) }];
	}
	reset() {
		this.game.reset();
	}

	awarding() {
		this.game.awarding();
	}
}

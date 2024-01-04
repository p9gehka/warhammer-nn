import { getStateTensor } from './utils.js';
import { getTF  } from '../dqn/utils.js';
import { GameAgent } from './game-agent0.1.js';
let tf = await getTF();

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
		return [...stepResult, { index, estimate }];
	}
	reset() {
		this.game.reset();
	}

	awarding() {}
}

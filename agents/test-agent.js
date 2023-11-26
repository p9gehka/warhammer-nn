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
		tf.tidy(() => {
			const inputTensor = getStateTensor([input], this.game.height, this.game.width, this.game.channels);
			const indexesArgMax = this.gameAgent.getIndexesArgMax();
			index = tf.mul(this.onlineNetwork.predict(inputTensor), tf.tensor2d(indexesArgMax, [1, 33])).argMax(-1).dataSync()[0];
		});
		this.game.step(this.game.orders.all[index]);
		return index;
	}
	reset() {
		this.game.reset();
	}
}

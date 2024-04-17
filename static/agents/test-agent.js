import { getStateTensor } from '../utils/get-state-tensor.js';
import { getTF } from '../utils/get-tf.js';
import { GameAgent } from './game-agent0.1.js';
import { Action } from '../environment/orders.js';

const tf = await getTF();

export class TestAgent {
	constructor(game, config = {}) {
		const { nn } = config;
		this.game = game;
		this.gameAgent = new GameAgent(game);
		this.onlineNetwork = nn;
	}

	playStep() {
		const input = this.game.getInput();
		const initState = this.game.env.getState();
		const { selected } = this.game.getState();
		let orderIndex = 0;
		let estimate = 0;
		const { height, width, channels } = this.game;
		tf.tidy(() => {
			const inputTensor = getStateTensor([input], this.game.height, this.game.width, this.game.channels);
			const prediction = this.onlineNetwork.predict(inputTensor);
			estimate = prediction.max(-1).dataSync()[0];
			orderIndex = prediction.argMax(-1).dataSync()[0];
		});

		let [order_, state , reward] = this.game.step(his.game.orders.orders.all[orderIndex]);

		if (initState.modelsStamina[selected] === state.modelsStamina[selected]) {
			 [,state,] = this.game.step({ action: Action.NextPhase });
		}

		return [order_, state, reward, { index, estimate: estimate.toFixed(3) }];
	}
	reset() {
		this.game.reset();
	}

	awarding() {
		this.game.awarding();
	}
}

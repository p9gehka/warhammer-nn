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
		let orderIndex = 0;
		let estimate = 0;
		const { height, width, channels } = this.game;
		tf.tidy(() => {
			const inputTensor = getStateTensor([input], height, width, channels);
			const indexesArgMax = this.gameAgent.getAvailableMoveArgMax();
			const predictions = this.onlineNetwork.predict(inputTensor);
			estimate = predictions.max(-1).dataSync()[0];
		 	orderIndex = tf.add(predictions, indexesArgMax).argMax(-1).dataSync()[0];
		});

		const order = this.game.orders.all[orderIndex];
		let [order_, state , reward] = this.game.step(order);
		const { selected } = this.game.getState();
		if(state.modelsStamina[selected] === 0 || order.expense === 0) {
			[,state,] = this.game.step({ action: Action.NextPhase })
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

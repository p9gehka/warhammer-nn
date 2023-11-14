
import { Orders, getStateTensor } from './utils.js';
import { getTF  } from '../dqn/utils.js';

let tf = await getTF();


export class TestAgent {
	orders = [];
	prevOrderIndex = null;
	constructor(game, config = {}) {
		const { nn } = config
		this.game = game;
		this.orders = (new Orders(this.game.env.players[this.game.playerId].models.length, this.game.env.players[this.game.enemyId].models.length)).getOrders();

		this.onlineNetwork = nn[0];
	
	}

	playStep() {

		const input = this.game.getInput();
		let index = 0;

		tf.tidy(() => {
			const inputTensor = getStateTensor([input], this.game.height, this.game.width, this.game.channels);
			index = this.onlineNetwork.predict(inputTensor).argMax(-1).dataSync()[0];
		});

		this.game.step(this.orders.all[index]);
		return index;
	}
}

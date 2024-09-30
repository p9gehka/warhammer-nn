import { getStateTensor } from '../../utils/get-state-tensor.js';
import { getTF } from '../../utils/get-tf.js';
import { moveOrders } from './move-orders.js';
import { Channel1Name } from '../../environment/nn-input.js';
import { getInput } from '../../environment/nn-input.js';
import { eq } from '../../utils/vec2.js';
import { RandomAgent } from '../random-agent.js';

const tf = await getTF();

export class MoveAgentBase {
	fillAgent = new RandomAgent(moveOrders, getInput);
	orders = moveOrders;
	async load() {
		this.onlineNetwork = await tf.loadLayersModel((typeof window === 'undefined' ? 'file://static/' : '') + this.loadPath);
	}
	playStep(state, playerState) {
		if (this.onlineNetwork === undefined) {
			return this.fillAgent.playStep(state);
		}
		const { orders, height, width, channels } = this;
		const input = getInput(state, playerState);

		let orderIndex = 0;
		let estimate = 0;
		const selected = state.models[state.players[state.player].models[playerState.selected]];
		if (input[Channel1Name.Stamina0].some(pos => eq(pos, selected)))  {
			orderIndex = 0;
		} else {
			tf.tidy(() => {
				const inputTensor = getStateTensor([input], width, height, channels);
				const prediction = this.onlineNetwork.predict(inputTensor);
				estimate = prediction.max(-1).dataSync()[0];
				orderIndex = prediction.argMax(-1).dataSync()[0];
			});
		}

		return { order: this.orders[orderIndex], orderIndex, estimate };
	}

	printStateTensor() {
		const input = this.getInput();
		const stateTensor = getStateTensor([input], this.width, this.height, this.channels);
		console.log('*************************');
		console.log(stateTensor.arraySync().map(v => v.map(c=> c.join('|')).join('\n')).join('\n'));
		console.log('*************************');
	}
	getInput(state) {
		return getInput(state)
	}
}

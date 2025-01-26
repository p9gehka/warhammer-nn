import { getStateTensor } from '../../utils/get-state-tensor.js';
import { getTF } from '../../utils/get-tf.js';
import { Channel1Name } from '../../environment/nn-input.js';
import { getInput } from '../../environment/nn-input.js';
import { eq } from '../../utils/vec2.js';
import { RandomAgent } from '../random-agent.js';

function channelRevers(channelName, totalObjects) {
	const convertObjective = totalObjects === 5 ? { ObjectiveMarker5: 'ObjectiveMarker1', ObjectiveMarker1: 'ObjectiveMarker5', ObjectiveMarker4: 'ObjectiveMarker2',  ObjectiveMarker2: 'ObjectiveMarker4'}
		: { ObjectiveMarker1: 'ObjectiveMarker3', ObjectiveMarker2: 'ObjectiveMarker4', ObjectiveMarker3: 'ObjectiveMarker1', ObjectiveMarker4: 'ObjectiveMarker2'};

		if (convertObjective[channelName] !== undefined) {
			return convertObjective[channelName];
		}
	return channelName;
}
function rotateInput(input, channels) {
	const result = {};
	let totalObjects = input.ObjectiveMarker5.length === 0 ? 4 : 5;
	channels.forEach((channel, i) => {
			for (let entity in channel) {
				result[channelRevers(entity, totalObjects)] = input[entity].map(pos => [44 - pos[0], 30 - pos[1]])
			}
	});
	//const input = state.player === 0 ? argInput : rotateInput(argInput);
	return result;
}

const tf = await getTF();

export class MoveAgentBase {
	fillAgent = new RandomAgent(this.orders, getInput);
	orders = [];
	async load() {
		this.onlineNetwork = await tf.loadLayersModel((typeof window === 'undefined' ? 'file://static/' : '') + this.loadPath);
	}
	playStep(state, playerState) {
		if (this.onlineNetwork === undefined) {
			return this.fillAgent.playStep(state);
		}
		const { orders, height, width, channels } = this;

		let input = getInput(state, playerState);
		const originalInput = input;
		if (this.orderRevers !== undefined && state.player === 1) {
			input = rotateInput(input, channels)
		}

		let orderIndex = 0;
		let estimate = 0;
		const selected = state.models[state.players[state.player].models[playerState.selected]];
		if (originalInput[Channel1Name.Stamina0].some(pos => eq(pos, selected)))  {
			orderIndex = 0;
		} else {
			tf.tidy(() => {
				const inputTensor = getStateTensor([input], width, height, channels);
				const prediction = this.onlineNetwork.predict(inputTensor);
				estimate = prediction.max(-1).dataSync()[0];
				orderIndex = prediction.argMax(-1).dataSync()[0];
				if (this.orderRevers !== undefined && state.player === 1) {
					orderIndex = this.orderRevers[orderIndex];
				}
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

import { MoveAgentBase } from './move-agent.js';
import { moveOrders  } from './move-orders.js';
import { channels } from '../../environment/nn-input.js';
import { Channel1Name, Channel2Name } from '../../environment/nn-input.js';
import { sub, eq, add, mul, len } from '../../utils/vec2.js'
import { BaseAction } from '../../environment/warhammer.js';

export class MoveAgent extends MoveAgentBase {
	static settings = { width: 44, height: 30, orders: moveOrders, channels: channels }
	width = MoveAgent.settings.width;
	height = MoveAgent.settings.height;
	channels = MoveAgent.settings.channels;
	orders = MoveAgent.settings.orders;
	load() {}

	playStep(state) {
		let orderIndex = 0;
		const input = this.getInput(state);
		//console.log(input)
		if (input[Channel1Name.Stamina0].length > 0) {
			orderIndex = 0;
		} else {

			let vector = [100,100];

			input[Channel2Name.ObjectiveMarker].forEach((object) => {
				const objectVector = mul(sub(input[0][0], object), -1)
				if (len(objectVector) < len(vector)) {
					vector = objectVector
				}
			})
			let [x, y] = vector;
			let stamina = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].findIndex(v => input[`Stamina${v}`].length > 0);
			if (x === 0 && y === 0) {
				orderIndex = 0
			} else {
				const axis = x >= 6 || x <= -5 || y === 0 ? 0 : 1;
				let value =  Math.max(-stamina, Math.min(vector[axis], stamina))
				value = Math.abs(value) >= 6 ? Math.max(-6, Math.min(6, value)) : Math.sign(value);
				orderIndex = this.orders.findIndex(order => order.action === BaseAction.Move && order.vector[axis] === value && order.vector[(axis+1)%2] === 0)
				if (orderIndex === -1) {
					console.log(x, y, axis, value)
				}
			}
		}

		return { order: this.orders[orderIndex], orderIndex, estimate: 0 };
	}
}

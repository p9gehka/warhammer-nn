import { MoveAgentBase } from './move-agent.js';
import { moveOrders, distancesDiagonalExpense, distancesDiagonal } from './move-orders.js';
import { channels } from '../../environment/nn-input.js';
import { Channel1Name } from '../../environment/nn-input.js';
import { sub, eq, add, mul } from '../../utils/vec2.js'
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
		if (input[Channel1Name.Stamina0].length > 0) {
			orderIndex = 0;
		} else {
			const vector = mul(sub(input[0][0], [22, 15]), -1);
			let [x, y] = vector;
			let stamina = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].findIndex(v => input[`Stamina${v}`].length > 0);
			if (x === 0 && y === 0) {
				orderIndex = 0
			} else if (stamina > 1 && Math.abs(x) === Math.abs(y)) {
				const signX = Math.sign(x);
				const signY = Math.sign(y);
				x = Math.abs(x);
				x = Math.min(x >= 4 ? 4 : 2, x);
				let availableStamina = Math.min(stamina >=6 ? 6 : 3, stamina);

				x = distancesDiagonal.findLast((v, i) => v <= x && distancesDiagonalExpense[i]<=availableStamina);
				orderIndex = this.orders.findIndex(order => order.action === BaseAction.Move && eq(order.vector, [signX * x, signY * x]))
			} else {
				const axis = Math.abs(x) > Math.abs(y) ? 0 : 1;
				let value =  Math.max(-stamina, Math.min(vector[axis], stamina))
				value = Math.abs(value) >= 6 ? Math.max(-6, Math.min(6, value)) : Math.max(-3, Math.min(3, value));
				orderIndex = this.orders.findIndex(order => order.action === BaseAction.Move && order.vector[axis] === value && order.vector[(axis+1)%2] === 0)
			}
		}

		return { order: this.orders[orderIndex], orderIndex, estimate: 0 };
	}
}

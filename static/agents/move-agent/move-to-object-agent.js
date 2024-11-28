import { MoveAgentBase } from './move-agent.js';
import { moveOrders  } from './move-orders.js';
import { channels } from '../../environment/nn-input.js';
import { Channel1Name, Channel2Name, Channel3Name } from '../../environment/nn-input.js';
import { sub, eq, add, mul, len } from '../../utils/vec2.js'
import { BaseAction } from '../../environment/warhammer.js';

export class MoveAgent extends MoveAgentBase {
	static settings = { width: 44, height: 30, orders: moveOrders, channels: channels }
	width = MoveAgent.settings.width;
	height = MoveAgent.settings.height;
	channels = MoveAgent.settings.channels;
	orders = MoveAgent.settings.orders;
	load() {}

	playStep(state, playerState) {
		const input = this.getInput(state, playerState);
		return this.playStepByInput(input);
	}

	playStepByInput(input) {
		let orderIndex = 0;
		const selected = input[Channel3Name.Order0][0];

		if (input[Channel1Name.Stamina0].some(pos => eq(pos, selected))) {
			orderIndex = 0;
		} else {
			let vector = [100,100];
			Object.values(Channel2Name).forEach(objectaName => {
				input[objectaName].forEach(object => {
					const objectVector = mul(sub(selected, object), -1);
					if (len([objectVector[0] * (this.height / this.width), objectVector[1]]) < len(vector)) {
						vector = objectVector
					}
				})
			})
			
			let [x, y] = vector;
			let stamina = Object.values(Channel1Name).findIndex(v => input[v].findIndex(pos => eq(pos, selected)) !== -1);

			if ((stamina === 0) || x === 0 && y === 0) {
				orderIndex = 0;
			} else {
				const axis = x >= 6 || x <= -5 || y === 0 ? 0 : 1;
				let value =  Math.max(-stamina, Math.min(vector[axis], stamina))
				value = Math.abs(value) >= 6 ? Math.max(-6, Math.min(6, value)) : Math.sign(value);
				orderIndex = this.orders.findIndex(order => order.action === BaseAction.Move && order.vector[axis] === value && order.vector[(axis+1)%2] === 0)
				if (orderIndex === -1) {
					console.log({ x, y, stamina, axis, value })
				}
			}

		}

		return { order: this.orders[orderIndex], orderIndex, estimate: 0 };
	}
}

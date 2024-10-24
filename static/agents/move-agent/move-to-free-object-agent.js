import { MoveAgentBase } from './move-agent.js';
import { moveOrders  } from './move-orders.js';
import { channels } from '../../environment/nn-input.js';
import { Channel1Name, Channel2Name, Channel3Name, Channel4Name } from '../../environment/nn-input.js';
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
		const opponentModels = Object.values(Channel4Name).map(channelKey => input[channelKey][0]).filter(v => v !== undefined);
		const objectsCoords = Object.values(Channel2Name).map(channelKey => input[channelKey]).filter(v => v.length !== 0);
		if (input[Channel1Name.Stamina0].some(pos => eq(pos, selected)) || isNaN(selected[0])) {
			orderIndex = 0;
		} else {
			let opponentToObjectLen = Array(objectsCoords.length).fill(0).map(() => 1000);

			opponentModels.forEach(op => {
				let oppVector = [100, 100];
				objectsCoords.forEach((objectCoords, i) => {
					objectCoords.forEach(object => {
						const lenToObject = len(mul(sub(op, object), -1))
						if (lenToObject < opponentToObjectLen[i]) {
							opponentToObjectLen[i] = lenToObject;
						}
					})
				})
			});

			let vector = [100, 100];
			objectsCoords.forEach((objectCoords, i) => {
				objectCoords.forEach(object => {
					const objectVector = mul(sub(selected, object), -1);
					const lenToObject = len(objectVector);
					if (lenToObject < len(vector) && lenToObject < opponentToObjectLen[i]) {
						vector = objectVector;
					}
				})
			})
			if (eq(vector, [100, 100])) {
				vector = [0, 0];
				opponentToObjectLen.forEach((l, i) => {
					if (l > len(vector)) {
						vector = mul(sub(selected, objectsCoords[i][0]), -1);
					}
				})
			}
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

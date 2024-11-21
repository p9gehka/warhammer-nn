import { MoveAgentBase } from './move-agent.js';
import { Channel0, Channel1, Channel2, Channel3, Channel4 } from '../../environment/nn-input.js';
import { angleToVec2, round, add } from '../../utils/vec2.js';
import { BaseAction } from '../../environment/warhammer.js';

/* `←``↑``→``↓``↖``↗``↘``↙`*/
const distances = [1, 6];
const distancesDiagonal = [1, 2, 4];
const distancesDiagonalExpense = [2, 3, 6];
const angles = [0, 90, 180, 270];

const orderRevers = [0, 5,6,7,8,1,2,3,4];

const angleSymbol = {'0': '↓' , '90': '←', '180': '↑' , '270': '→', '0+90': '↙', '90+180': '↖', '180+270': '↗', '270+0': '↘' };

export const moveOrders = [
	{ action: BaseAction.NextPhase },
	{ action: BaseAction.Move, vector: round(angleToVec2(1, 0)), expense: 1, symbol: '↓' },
	{ action: BaseAction.Move, vector: round(angleToVec2(6, 0)), expense: 6, symbol: '↓' },
	{ action: BaseAction.Move, vector: round(angleToVec2(1, 90)), expense: 1, symbol: '←' },
	{ action: BaseAction.Move, vector: round(angleToVec2(6, 90)), expense: 6, symbol: '←' },

	{ action: BaseAction.Move, vector: round(angleToVec2(1, 180)), expense: 1, symbol: '↑' },
	{ action: BaseAction.Move, vector: round(angleToVec2(6, 180)), expense: 6, symbol: '↑' },
	{ action: BaseAction.Move, vector: round(angleToVec2(1, 270)), expense: 1, symbol: '→' },

	{ action: BaseAction.Move, vector: round(angleToVec2(6, 270)), expense: 6, symbol: '→' }

];


export class MoveAgent extends MoveAgentBase {
	static settings = { width: 60, height: 44, orders: moveOrders, channels: [Channel0, Channel1, Channel2, Channel3, Channel4] }
	width = MoveAgent.settings.width;
	height = MoveAgent.settings.height;
	channels = MoveAgent.settings.channels;
	orders = MoveAgent.settings.orders;
	loadPath = `agents/move-agent/.model${this.width}x${this.height}x${this.channels.length}/model.json`;
}

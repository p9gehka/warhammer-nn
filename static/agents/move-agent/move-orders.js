import { angleToVec2, round, add } from '../../utils/vec2.js';
import { BaseAction } from '../../environment/warhammer.js';

/* `←``↑``→``↓``↖``↗``↘``↙`*/
const distances = [1, 6];
const distancesDiagonal = [1, 2, 4];
const distancesDiagonalExpense = [2, 3, 6];
const angles = [0, 90, 180, 270];

export const moveOrders = [{ action: BaseAction.NextPhase }];
const angleSymbol = {'0': '↓' , '90': '←', '180': '↑' , '270': '→', '0+90': '↙', '90+180': '↖', '180+270': '↗', '270+0': '↘' };
angles.forEach((angle, i) => {
	for (let distance of distances) {
		moveOrders.push({ action: BaseAction.Move, vector: round(angleToVec2(distance, angle)), expense: distance, symbol: angleSymbol[angle] });
	}
	/*
	distancesDiagonal.forEach((distance, ii) => {
		const vector1 = angleToVec2(distance, angle);
		const vector2 = angleToVec2(distance, angles[(i+1) % angles.length]);
		const vector = round(add(vector1, vector2));
		moveOrders.push({ action: BaseAction.Move, vector, expense: distancesDiagonalExpense[ii] });
	});
	*/
});

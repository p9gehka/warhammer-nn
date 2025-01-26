import { rotatedDegrees } from '../utils/vec2.js';

export function baseVerticalRuin(x, y) {
	return [[0, 0], [6, 0], [6, 10], [0, 10]].map(([x1, y1]) => [x1 + x, y1 + y]);
}

export function baseHorisontalRuin(x, y) {
	return [[0, 0], [0, 6], [10, 6], [10, 0]].map(([x1, y1]) => [x1 + x, y1 + y]);
}

export function thinVerticalRuin(x, y) {
	return [[0, 0], [4, 0], [4, 6], [0, 6]].map(([x1, y1]) => [x1 + x, y1 + y]);
}

export function thinHorisontalRuin(x, y) {
	return [[0, 0], [0, 4], [6, 4], [6, 0]].map(([x1, y1]) => [x1 + x, y1 + y]);
}

export function footprint10x7(x, y, degrees = 0) {
	return footprintRotatedDegrees([[0, 0], [7, 0], [7, 10], [0, 10]], degrees).map(([x1, y1]) => [x1 + x, y1 + y]);
}

export function footprint5x2(x, y, degrees = 0) {
	return footprintRotatedDegrees([[0, 0], [2, 0], [2, 5], [0, 5]], degrees).map(([x1, y1]) => [x1 + x, y1 + y]);
}
export function footprint2x2(x, y, degrees = 0) {
	return footprintRotatedDegrees([[0, 0], [2, 0], [2, 2], [0, 2]], degrees).map(([x1, y1]) => [x1 + x, y1 + y]);
}

export function footprintRotatedDegrees(footprint, degrees) {
	return footprint.map(point => rotatedDegrees(point, degrees))
}

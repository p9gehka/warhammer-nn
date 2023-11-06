export function len([x, y]) {
	return Math.sqrt(x ** 2 + y ** 2);
}
export function mul([x, y], other) {
	return [x * other, y * other];
}

export function div([x, y], divider) {
	return [x / divider, y / divider];
}

export function add([x1, y1], [x2, y2]) {
	return [x1 + x2, y1 + y2];
}

export function sub([x1, y1], [x2, y2]) {
	return [x1 - x2, y1 - y2];
}

export function toRadians(degrees) {
	return degrees * (Math.PI / 180);
}

function rotated([x, y], angleRadians) {
	const cos = Math.cos(angleRadians);
	const sin = Math.sin(angleRadians);
	return [x * cos - y * sin, x * sin + y * cos];
}

export function round2([x, y]) {
	return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

export function round([x, y]) {
	return [Math.round(x), Math.round(y)];
}

export function rotatedDegrees(vec, degrees) {
	return rotated(vec, toRadians(degrees));
}

export function scaleToLen([x, y], newLength) {
	const oldLength = len([x, y]);
	return [x * newLength / oldLength, y * newLength / oldLength];
}

export function angleToVec2 (distance, angle) {
	return distance === 0 ? [0, 0] : rotatedDegrees([0, distance], angle);
}
export function getRandomInteger(min, max) {
	return Math.floor((max - min) * Math.random()) + min;
}

export function filterObjByKeys(obj, keys) {
	return Object.fromEntries(keys.map(k => [k, obj[k]]));
}

export function argMax(array) {
	return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

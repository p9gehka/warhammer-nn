export function getRandomInteger(min, max) {
	return Math.floor((max - min) * Math.random()) + min;
}

export function filterObjByKeys(obj, keys) {
	return Object.fromEntries(keys.map(k => [k, obj[k]]));
}

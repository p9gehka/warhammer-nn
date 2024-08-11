import { getRandomInteger } from '../utils/index.js';

function d6() {
	return getRandomInteger(1, 7);
}

export function shotDice(weapon) {
	const numberOfAttack = Number.isInteger(weapon.a) ? weapon.a : weapon.a(d6());
	const hits = Array(numberOfAttack).fill(0).map(d6);
	const wounds = Array(numberOfAttack).fill(0).map(d6);
	const damages = Array(numberOfAttack).fill(0).map(() => Number.isInteger(weapon.d) ? weapon.d : weapon.d(d6()));
	return { hits, wounds, damages };
}


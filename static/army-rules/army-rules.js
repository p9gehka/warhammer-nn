import { ForTheGreaterGood } from './for-the-greater-good/for-the-greater-good.js';

export const armyRules = {
	"For The Greater Good": ForTheGreaterGood
}

export function createArmyRules(armyRule) {
	return armyRules[armyRule] === undefined ? undefined : new armyRules[armyRule]();
}

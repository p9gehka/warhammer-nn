import { getRandomInteger } from '../utils/index.js';
import { d6 } from '../environment/d6.js';

function parseProfile(value) {
	let damage = parseInt(value);
	if (!isNaN(damage)) {
		return damage;
	}

	const [diceCondition, tail] = value.split('+');
	return (diceResult) => {
		if(diceCondition === 'd3') {
			diceResult = Math.ceil(d6Result/3);
		}
		let tailValue = parseInt(tail);
		tailValue = isNaN(tailValue) ? 0 : tailValue
		return diceResult + tailValue;
	}
}

function parseCharacteristic(value) {
	let result = value[0] === 'D' ? '1' + value : value;
	result = result.indexOf('D') === -1 ? ('0D6+' + result) : result;
	result = result.indexOf('+') === -1 ? (result + '+0') : result;
	const [diceTotal, tail] = result.split('D');
	const [dice, constant] = tail.split('+');
	return { diceTotal: parseInt(diceTotal), constant: parseInt(constant), dice: 'd'+dice };
}

export function shotDice(diceSequenceArg, weapon) {
	const diceSequence = diceSequenceArg;
	if (weapon === undefined) {
		return {};
	}

	const dices = {
		d6: () => diceSequence.shift() ?? d6(),
		d3: () => Math.ceil(dices.d6()/2)
	}

	const { diceTotal, constant, dice } = parseCharacteristic(weapon.a);
	const attacks = Array(diceTotal).fill(0).map(dices[dice]);
	const attacksTotal = attacks.reduce((a, b) => a + b, 0) + constant;
	let hits = Array(attacksTotal).fill(0).map(dices.d6);
	const weaponKeywords = weapon.keywords;
	if (weaponKeywords.includes('Torrent')) {
		 hits = Array(attacksTotal).fill(7);
	}
	let autowound = 0;
	let successfulHits = hits.filter(hit => hit >= parseInt(weapon.bs)).length;
	if (weaponKeywords.includes('Lethal Hits')) {
		hits.forEach(hit => {
			if (hit === 6) {
				autowound++;
				successfulHits--;
			}
		});
	}
	const wounds = [...Array(successfulHits).fill(0).map(dices.d6), ...Array(autowound).fill(7)];

	const { diceTotal: damageDiceTotal, dice: damageDice, constant: constantDamage } = parseCharacteristic(weapon.d);
	const damages = Array(wounds.length).fill(0).map(() => Array(damageDiceTotal).fill(0).map(dices[damageDice]));
	return { hits, wounds, damages, attacks, constantDamage: Array(wounds.length).fill(constantDamage) };
}

export class DiceTray {
	dices = [];

	remove(index) {
		this.dices.splice(index, 1); 
	}
	roll() {
		this.dices.push(d6());
	}
	clear() {
		this.dices = [];
	}
}

const armyRules = {}

class DefaultArmyRule {
	constructor(armyRule) {
		this.armyRule = armyRule;
	}
	render(element) {
		element.innerHTML='';
		element.append(this.armyRule);
	}
}
export function createArmyRules(armyRule) {
	if (armyRules[armyRule] === undefined) {
		return new DefaultArmyRule(armyRule);
	}
}

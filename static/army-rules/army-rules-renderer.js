import { ForTheGreaterGoodRenderer } from './for-the-greater-good/for-the-greater-good-renderer.js';

const armyRulesRenderers = {
	'For The Greater Good': ForTheGreaterGoodRenderer,
}

class DefaultArmyRuleRenderer {
	render(element) {
		element.innerHTML='';
	}
}

export function getArmyRulesRenderer(service) {
	if (service === undefined || armyRulesRenderers[service.name] === undefined) {
		return new DefaultArmyRuleRenderer();
	}

	return new armyRulesRenderers[service.name](service);
}

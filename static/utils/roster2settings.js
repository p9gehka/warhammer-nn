export function roster2settings(roster) {
	const profiles = [];
	const categories = [];
	const rules = [];
	const units = [];
	let modelsCounter = 0;

	roster.roster.forces.force.selections.selection
		.filter( v =>v._attributes.type === "unit" || v._attributes.type === "model")
		.forEach(rosterUnit => {

			let rosterSelection = rosterUnit.selections.selection;
			if (!Array.isArray(rosterSelection)) {
				rosterSelection = [rosterSelection];
			}
			let unitModelsNumber = 1;
			if (rosterUnit._attributes.type === "unit") {
				unitModelsNumber = rosterSelection.filter(v=>v._attributes.type === "model").reduce((modelsCount, selection)=> modelsCount + parseInt(selection._attributes.number), 0);
			}
			let models = Array(unitModelsNumber).fill(0).map((_, i) => i+modelsCounter);
			modelsCounter += unitModelsNumber;
			const result = { name: rosterUnit._attributes.name.toLowerCase(), models };
			const profile = {};
			rosterUnit.profiles.profile.filter(p => p._attributes.typeName === 'Unit')[0].characteristics.characteristic.forEach(ch => {
				profile[ch._attributes.name] = ch._text;
			});

			const category = rosterUnit.categories.category.map(r => r._attributes.name.toLowerCase());

			let rosterRule = rosterUnit.rules.rule;
			if (!Array.isArray(rosterRule)) {
				rosterRule = [rosterRule];
			}
			const rule = rosterRule.map(r => r._attributes.name.toLowerCase());
			rules.push(rule);
			categories.push(category);
			profiles.push(profile);
			units.push(result);
		});

	return { units, profiles, categories, rules };
}

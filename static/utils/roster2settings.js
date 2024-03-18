export function roster2settings(roster) {
	const profiles = [];
	const categories = [];
	const rules = [];
	const units = [[], []].map(() => {
		const unit = []

		roster.roster.forces.force.selections.selection
			.filter( v =>v._attributes.type === "unit" || v._attributes.type === "model")
			.forEach(rosterUnit => {
				const result = { name: rosterUnit._attributes.name.toLowerCase(), models: [profiles.length] };
				const profile = {};
				rosterUnit.profiles.profile.filter(p => p._attributes.typeName === 'Unit')[0].characteristics.characteristic.forEach(ch => {
					profile[ch._attributes.name] = ch._text;
				});

				const category = rosterUnit.categories.category.map(r => r._attributes.name.toLowerCase());

				let rosterRule = rosterUnit.rules.rule;
				if (!Array.isArray(rosterRule)) {
					rosterRule = [rosterUnit.rules.rule];
				}
				const rule = rosterRule.map(r => r._attributes.name.toLowerCase());
				rules.push(rule);
				categories.push(category);
				profiles.push(profile);
				unit.push(result);

			});
		return unit;
	});

	return { units, profiles, categories, rules };
}
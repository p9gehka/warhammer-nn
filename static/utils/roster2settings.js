export function roster2settings(roster) {
	const profiles = [];
	const categories = [];
	const rules = [];
	const units = [];
	const rangedWeapons = [];
	let modelsCounter = 0;

	roster.roster.forces.force.selections.selection
		.filter( v =>v._attributes.type === "unit" || v._attributes.type === "model")
		.forEach(rosterUnit => {
			if (rosterUnit._attributes.type === "model") {
				rosterUnit = {
					_attributes: {
						"number": "1",
						"type": "unit",
						"name": rosterUnit._attributes.name
					},
					selections: {
						selection: [rosterUnit]
					},
					profiles: rosterUnit.profiles,
					categories: rosterUnit.categories,
					rules: rosterUnit.rules,
				};
			}
			let rosterSelection = rosterUnit.selections.selection;
			if (!Array.isArray(rosterSelection)) {
				rosterSelection = [rosterSelection];
			}
			const unitRangedWeapons = [];

			rosterSelection.forEach(unitSelectionArg => {
				if (unitSelectionArg._attributes.type !== 'model') {
					return;
				}
				let unitSelection = unitSelectionArg.selections.selection;

				if (!Array.isArray(unitSelection)) {
					unitSelection = [unitSelection];
				}
				unitSelection = unitSelection.map(s => {

					if (s.profiles.profile === undefined) {
						s = {
								...s,
								_attributes: s.selections.selection._attributes,
								profiles: s.selections.selection.profiles
						};
					}

					if(Array.isArray(s.profiles.profile)) {
						return s.profiles.profile.map((profile) => {
							return {
									...s,
									_attributes: profile._attributes,
									profiles: { profile }
							}
						})
					}
					return [s]
				}).flat();

				const profiles = unitSelection.filter(s => s.profiles.profile._attributes.typeName === 'Ranged Weapons').map(s => {
					const number =  parseInt(s._attributes.number ?? 1);
					const profile = {
						name: s.profiles.profile._attributes.name
					};
					s.profiles.profile.characteristics.characteristic.forEach(ch => {
						profile[ch._attributes.name] = ch._text;
					});
					return new Array(number).fill(profile);
				}).flat();
				const number =  parseInt(unitSelectionArg._attributes.number);
				unitRangedWeapons.push(...(new Array(number).fill(profiles)));
			})

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
			rangedWeapons.push(...unitRangedWeapons)
		});

	return { units, profiles, categories, rules, rangedWeapons };
}

export function roster2settings(roster) {
	const unitProfiles = [];
	const modelProfiles = [];
	const categories = [];
	const rules = [];
	const units = [];
	const modelNames = []
	const rangedWeapons = [];
	const meleeWeapons = [];
	let modelsCounter = 0;

	roster.roster.forces.force.selections.selection
		.filter( v => v._attributes.type === "unit" || v._attributes.type === "model")
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

			const unitProfile = {};
			let rosterUnitProfiles = rosterUnit.profiles.profile;
			if (!Array.isArray(rosterUnitProfiles)) {
				rosterUnitProfiles = [rosterUnitProfiles];
			}

			rosterUnitProfiles.filter(p => p?._attributes.typeName === 'Unit')[0]?.characteristics?.characteristic?.forEach(ch => {
				unitProfile[ch._attributes.name] = ch._text;
			});

			const unitModelsNames = [];
			const unitRangedWeapons = [];
			const unitMeleeWeapons = [];
			const unitModelsProfiles = [];
			rosterSelection.forEach(unitSelectionArg => {
				if (unitSelectionArg._attributes.type !== 'model') {
					return;
				}
				let unitSelection = unitSelectionArg.selections.selection;

				if (!Array.isArray(unitSelection)) {
					unitSelection = [unitSelection];
				}
				unitSelection = unitSelection.map(s => {
					if (s.profiles?.profile === undefined && s.selections?.selection !== undefined) {
						s = {
							...s,
							_attributes: s.selections.selection._attributes,
							profiles: s.selections.selection.profiles
						};
					}

					if(Array.isArray(s.profiles?.profile)) {
						return s.profiles.profile.map((profile) => {
							return {
								...s,
								_attributes: {
									...profile._attributes,
									number: s._attributes.number,
								},
								profiles: { profile }
							}
						})
					}
					return [s]
				}).flat();

				const modelNumber =  parseInt(unitSelectionArg._attributes.number);

				const fillProfile = (s) => {
					const weaponNumberTotal = parseInt(s._attributes.number ?? 1);
					const weaponNumber = weaponNumberTotal === modelNumber ? 1 : weaponNumberTotal;
					const profile = {
						name: s.profiles.profile._attributes.name
					};
					s.profiles.profile.characteristics.characteristic.forEach(ch => {
						profile[ch._attributes.name] = ch._text;
					});
					return new Array(weaponNumber).fill(profile);
				}
				const rangedProfiles = unitSelection.filter(s => s.profiles?.profile?._attributes?.typeName === 'Ranged Weapons').map(fillProfile).flat();
				const meleeProfiles = unitSelection.filter(s => s.profiles?.profile?._attributes?.typeName === 'Melee Weapons').map(fillProfile).flat();

				let modelProfile = { ...unitProfile };

				let subUnitProfile = unitSelectionArg.profiles?.profile;
				if (!Array.isArray(subUnitProfile)) {
					subUnitProfile = [subUnitProfile];
				}

				subUnitProfile = subUnitProfile.filter(p => p?._attributes?.typeName === 'Unit')[0];
				if (subUnitProfile !== undefined) {
					subUnitProfile.characteristics.characteristic.forEach(ch => {
						modelProfile[ch._attributes.name] = ch._text;
					});
				}

				unitModelsNames.push(...(new Array(modelNumber).fill(unitSelectionArg._attributes.name)));
				unitRangedWeapons.push(...(new Array(modelNumber).fill(rangedProfiles)));
				unitMeleeWeapons.push(...(new Array(modelNumber).fill(meleeProfiles)));
				unitModelsProfiles.push(...(new Array(modelNumber).fill(modelProfile)));
			})

			let unitModelsNumber = 1;
			if (rosterUnit._attributes.type === "unit") {
				unitModelsNumber = rosterSelection.filter(v=>v._attributes.type === "model").reduce((modelsCount, selection)=> modelsCount + parseInt(selection._attributes.number), 0);
			}
			let models = Array(unitModelsNumber).fill(0).map((_, i) => i+modelsCounter);
			modelsCounter += unitModelsNumber;
			const result = { name: rosterUnit._attributes.name.toLowerCase(), models };

			const category = rosterUnit.categories.category.map(r => r._attributes.name.toLowerCase());

			let rosterRule = rosterUnit.rules.rule;
			if (!Array.isArray(rosterRule)) {
				rosterRule = rosterRule !== undefined ? [rosterRule] : [];
			}
			const rule = rosterRule.map(r => r._attributes.name.toLowerCase());
			rules.push(rule);
			categories.push(category);
			units.push(result);
			unitProfiles.push(unitProfile);
			modelProfiles.push(...unitModelsProfiles);
			modelNames.push(...unitModelsNames);
			rangedWeapons.push(...unitRangedWeapons);
			meleeWeapons.push(...unitMeleeWeapons);
		});

	return { units, unitProfiles, modelProfiles, categories, rules, modelNames, rangedWeapons, meleeWeapons };
}

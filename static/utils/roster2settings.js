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

	roster.roster.forces[0].selections
		.filter(selection => selection.type === "unit" || selection.type === "model")
		.forEach(rosterUnit => {
			if (rosterUnit.type === "model") {
				rosterUnit = {
					"number": 1,
					"type": "unit",
					"name": rosterUnit.name,
					selections: [rosterUnit],
					profiles: rosterUnit.profiles,
					categories: rosterUnit.categories,
					rules: rosterUnit.rules,
				};
			}
			let rosterSelection = rosterUnit.selections;
			let rosterUnitProfiles = rosterUnit.profiles;
			const unitProfile = {};

			rosterUnitProfiles.filter(p => p.typeName === 'Unit')[0].characteristics.forEach(ch => {
				unitProfile[ch.name] = ch.$text;
			});

			const unitModelsNames = [];
			const unitRangedWeapons = [];
			const unitMeleeWeapons = [];
			const unitModelsProfiles = [];

			rosterSelection.forEach(unitSelectionArg => {
				if (unitSelectionArg.type !== 'model') {
					return;
				}
				const unitSelection = unitSelectionArg.selections;
				const modelsNumber = unitSelectionArg.number;

				const fillProfile = (s) => {
					const weaponNumberTotal = s.number ?? 1;
					const weaponNumber = weaponNumberTotal === modelsNumber ? 1 : weaponNumberTotal;
					const profile = {
						name: s.profiles[0].name
					};
					s.profiles[0].characteristics.forEach(ch => {
						profile[ch.name] = ch.$text;
						if (ch.name === 'AP') {
							profile[ch.name] = `-${Math.abs(parseInt(ch.$text))}`
						}
					});
					return new Array(weaponNumber).fill(profile);
				}
				const rangedProfiles = unitSelection.filter(s => s.profiles !== undefined && s.profiles[0].typeName === 'Ranged Weapons').map(fillProfile).flat();
				const meleeProfiles = unitSelection.filter(s => s.profiles !== undefined && s.profiles[0].typeName === 'Melee Weapons').map(fillProfile).flat();

				let modelProfile = { ...unitProfile };

				let subUnitProfile = unitSelectionArg.profiles ?? []

				subUnitProfile = subUnitProfile.filter(p => p.typeName === 'Unit')[0];
				if (subUnitProfile !== undefined) {
					subUnitProfile.characteristics.forEach(ch => {
						modelProfile[ch.name] = ch.$text;
					});
				}

				unitModelsNames.push(...(new Array(modelsNumber).fill(unitSelectionArg.name)));
				unitRangedWeapons.push(...(new Array(modelsNumber).fill(rangedProfiles)));
				unitMeleeWeapons.push(...(new Array(modelsNumber).fill(meleeProfiles)));
				unitModelsProfiles.push(...(new Array(modelsNumber).fill(modelProfile)));
			});
			let unitModelsNumber = 1;
			if (rosterUnit.type === "unit") {
				unitModelsNumber = rosterSelection.filter(v=>v.type === "model").reduce((modelsCount, selection)=> modelsCount + selection.number, 0);
			}

			let models = Array(unitModelsNumber).fill(0).map((_, i) => i+modelsCounter);
			modelsCounter += unitModelsNumber;
			const result = { name: rosterUnit.name.toLowerCase(), models };
			const category = rosterUnit.categories.map(r => r.name.toLowerCase());
			let rosterRule = rosterUnit.rules;

			const rule = rosterRule.map(r => r.name.toLowerCase());
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

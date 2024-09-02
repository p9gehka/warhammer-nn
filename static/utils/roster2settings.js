export function roster2settings(roster) {
	const modelProfiles = [];
	const categories = [];
	const abilities = [];
	const rules = [];
	const units = [];
	const modelNames = []
	const rangedWeapons = [];
	const meleeWeapons = [];
	let modelsCounter = 0;
	const detachmentRules = []
	roster.roster.forces[0].selections
		.filter(selection => selection.name === "Detachment")
		.forEach(detachment => {
			detachment.selections.forEach(selection => {
				detachmentRules.push(selection.name.toLowerCase());
			})
		})

	roster.roster.forces[0].selections
		.filter(selection => selection.type === "unit" || selection.type === "model")
		.forEach(rosterUnit => {
			if (rosterUnit.type === "model") {
				rosterUnit = {
					number: 1,
					type: "unit",
					name: rosterUnit.name,
					selections: [rosterUnit],
					categories: rosterUnit.categories,
				};
			}
			let rosterSelection = rosterUnit.selections;

			let rosterUnitProfiles = rosterUnit.profiles ?? [];
			const unitRules = [...detachmentRules, ...rosterUnit.rules?.map(r => r.name.toLowerCase()) ?? []];

			const unitModelsNames = [];
			const unitRangedWeapons = [];
			const unitMeleeWeapons = [];
			const unitModelsProfiles = [];
			const unitModelsRules = [];
			const unitModelsAbilities = [];
			rosterSelection.forEach(unitSelectionArg => {
				if (unitSelectionArg.type !== 'model') {
					return;
				}
				const unitSelection = unitSelectionArg.selections.map(s => {
					if(Array.isArray(s.profiles)) {
						return s.profiles.map((profile) => {
							return {
								...s,
								...profile,
								profiles: [profile]
							}
						})
					}
					return [s]
				}).flat();
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



				let modelProfile = [...rosterUnitProfiles, ...unitSelectionArg.profiles ?? []];
				let modelCharacteristics = {};
				let modelAbilities = [];
				modelProfile.forEach(profile => {
					if (profile.typeName === "Unit") {
						profile.characteristics.forEach(ch => {
							modelCharacteristics[ch.name] = ch.$text;
						});
					}

					if (profile.typeName === "Abilities") {

						let name = profile.name.toLowerCase();
						if (name === 'invulnerable save') {
							name = `${name} (${profile.characteristics[0].$text})`;
						}
						modelAbilities.push(name)
					}
				})
				unitModelsAbilities.push(...(new Array(modelsNumber).fill(modelAbilities)));

				unitModelsNames.push(...(new Array(modelsNumber).fill(unitSelectionArg.name)));
				unitRangedWeapons.push(...(new Array(modelsNumber).fill(rangedProfiles)));
				unitMeleeWeapons.push(...(new Array(modelsNumber).fill(meleeProfiles)));
				unitModelsProfiles.push(...(new Array(modelsNumber).fill(modelCharacteristics)));

				const modelRules = [...unitRules];
				unitSelectionArg.rules?.forEach(r => {
					modelRules.push(r.name.toLowerCase());
				});
				unitModelsRules.push(...(new Array(modelsNumber).fill(modelRules)));
			});
			let unitModelsNumber = 1;
			if (rosterUnit.type === "unit") {
				unitModelsNumber = rosterSelection.filter(v=>v.type === "model").reduce((modelsCount, selection)=> modelsCount + selection.number, 0);
			}

			let models = Array(unitModelsNumber).fill(0).map((_, i) => i+modelsCounter);
			modelsCounter += unitModelsNumber;
			const result = { name: rosterUnit.name.toLowerCase(), models };
			const category = rosterUnit.categories.map(r => r.name.toLowerCase());

			abilities.push(...unitModelsAbilities);
			rules.push(...unitModelsRules);
			categories.push(category);
			units.push(result);
			modelProfiles.push(...unitModelsProfiles);
			modelNames.push(...unitModelsNames);
			rangedWeapons.push(...unitRangedWeapons);
			meleeWeapons.push(...unitMeleeWeapons);
		});

	return { units, modelProfiles, categories, rules, modelNames, rangedWeapons, meleeWeapons, abilities };
}

export function roster2settings(roster) {
	const name = roster.roster.forces.force.selections.selection.filter(v=>v._attributes.type === "unit")[0];
	const profiles = [];
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
				profiles.push(profile);
				unit.push(result);
			});
		return unit;
	})
	return { units, profiles};
}
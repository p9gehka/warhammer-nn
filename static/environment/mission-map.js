import { len, sub } from '../utils/vec2.js';
import { deployment } from '../battlefield/deployment.js';
import { Rect } from '../utils/planimatrics/rect.js';
import { Circle } from '../utils/planimatrics/circle.js';

export const Mission = {
	BehindEnemyLines: 'BehindEnemyLines',
	EngageOnAllFronts: 'EngageOnAllFronts',
	Cleanse: 'Cleanse',
	EstablishLocus: 'EstablishLocus',
	DefendStronhold: 'DefendStronhold',
	SecureNoMansLand: 'SecureNoMansLand',
	ExtendBattleLines: 'ExtendBattleLines',
	Assassination: 'Assassination',
	NoPrisoners: 'NoPrisoners',
	OverwhelmingForce: 'OverwhelmingForce',
	StormHostileObjective: 'StormHostileObjective',
	BringItDown: 'BringItDown',
	AreaDenial: 'AreaDenial',

	RecoverAssets: 'RecoverAssets',
	CullTheHorde: 'CullTheHorde',
	Containment: 'Containment',
	MarketForDeath: 'MarkedForDeath',
	Sabotage: 'Sabotage'
}

const center = [30, 22];
function onBattlefield(position) {
	return !isNaN(position[0]);
}
class BehindEnemyLines {
	static scoreSecondaryVP(state, profiles, categories) {
		const opponentPlayer = (state.player + 1) % 2;
		const playerDeployment = new deployment[state.battlefield.deployment];
		let completed = false;
		let secondaryVP = 0;
		const hollyWithinCounter = state.players[state.player].units.filter(unit => {
			const modelsOnBattlefield = unit.models.filter(modelId => onBattlefield(state.models[modelId]));
			return modelsOnBattlefield.length > 0 && modelsOnBattlefield.every(modelId => playerDeployment.include(opponentPlayer, state.models[modelId]) && !categories[modelId].includes('aircraft'));
		}).length;

		if (hollyWithinCounter >= 2) {
			secondaryVP += 1;
		}
		if(hollyWithinCounter > 0) {
			secondaryVP += 3;
			completed = true;
		}
		return { completed, secondaryVP };
	}
}

class EngageOnAllFronts {
	static scoreSecondaryVP(state, profiles, categories) {
		let completed = false;
		let secondaryVP = 0;

		const quatres = [new Rect(0, 0, 30, 22), new Rect(0, 25, 30, 22), new Rect(33, 0, 30, 22), new Rect(33, 25, 30, 22)];
		const centerCircle = [new Circle(...center, 6)]
		let quatrCounters = [0, 0, 0, 0];

		state.players[state.player].units.forEach(unit => {
			const modelsOnBattlefield = unit.models.filter(modelId => onBattlefield(state.models[modelId]));
			if(modelsOnBattlefield.length === 0) {
				return;
			}
			quatres.forEach((quatr, i) => {
				if(modelsOnBattlefield.every(modelId =>
					quatr.include(...state.models[modelId]) && !centerCircle.includes(...state.models[modelId])
				)) {
					quatrCounters[i]++;
				}
			});
		});

		const totalQuatres = quatrCounters.filter(v => v !== 0).length;
		if (totalQuatres === 4) {
			secondaryVP += 2;
		}
		if(totalQuatres >= 3) {
			secondaryVP += 2;
			completed = true;
		}
		return { completed, secondaryVP };
	}
}

class Cleanse {
	static scoreSecondaryVP(state, profiles, categories) {
		const activePlayerId = state.player;
		const opponentPlayer = (state.player + 1) % 2;
		const playerDeployment = new deployment[state.battlefield.deployment];
		let completed = false;
		let secondaryVP = 0;

		const cleanseMarkers = [...playerDeployment.nomansland_markers];
		const opponentDeploymentMarker = playerDeployment.deploy_markers[opponentPlayer];
		if (opponentDeploymentMarker !== undefined) {
			cleanseMarkers.push(opponentDeploymentMarker);
		}
		const objectiveControl = Array(cleanseMarkers.length).fill(0);
		state.players.forEach((player, modelPlayerId) => {
			player.models.forEach(modelId => {
				cleanseMarkers.forEach((markerPosition, i) => {
					const modelPosition = state.models[modelId];
					if (len(sub(modelPosition, markerPosition)) <= playerDeployment.objective_marker_control_distance) {
						const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
						const oc = profiles[modelId].oc * ocSign;
						objectiveControl[i] += oc;
					}
				});
			})
		});
		const cleanedMarkersCount = objectiveControl.filter(oc => oc > 0).length;
		if (cleanedMarkersCount >= 2) {
			secondaryVP += 2;
		}
		if (cleanedMarkersCount >= 1) {
			secondaryVP += 2;
			completed = true;
		}
		return { completed, secondaryVP };
	}
}

class EstablishLocus {
	static scoreSecondaryVP(state, profiles, categories) {
		const opponentPlayer = (state.player + 1) % 2;
		const playerDeployment = new deployment[state.battlefield.deployment];
		let completed = false;
		let secondaryVP = 0;
		let center6Circle = new Circle(...center, 6);
		let inOpponentDeploy = false;
		let inCenter = false;

		for (let modelId of state.players[state.player].models) {
			if (playerDeployment.include(opponentPlayer, state.models[modelId])) {
				inOpponentDeploy = true;
				continue;
			} else if (center6Circle.include(...state.models[modelId])) {
				inCenter = true;
			}
		}

		if (inOpponentDeploy) {
			secondaryVP += 2;
		} 

		if (inCenter || inOpponentDeploy) {
			secondaryVP += 2;
			complete = true;
		}
		return { completed, secondaryVP };
	}
}

class SecureNoMansLand {
	static scoreSecondaryVP(state, profiles, categories) {
		const playerDeployment = new deployment[state.battlefield.deployment];
		const objectiveControl = Array(playerDeployment.nomansland_markers.length).fill(0);
		let completed = false;
		let secondaryVP = 0;
		state.players.forEach((player, modelPlayerId) => {
			player.models.forEach(modelId => {
				playerDeployment.nomansland_markers.forEach((markerPosition, i) => {
					const modelPosition = state.models[modelId];
					if (len(sub(modelPosition, markerPosition)) <= playerDeployment.objective_marker_control_distance) {
						const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
						const oc = profiles[modelId].oc * ocSign;
						objectiveControl[i] += oc;
					}
				});
			})
		});
		const securedNoMansCount = objectiveControl.filter(oc => oc > 0).length;
		if (securedNoMansCount >= 2) {
			secondaryVP += 3;
		}
		if(securedNoMansCount >= 1) {
			secondaryVP += 2;
			completed = true;
		}
		return { completed, secondaryVP };
	}
}

class AreaDenial {
	static scoreSecondaryVP(state, profiles, categories) {
		let completed = false;
		let secondaryVP = 0;
		let center6Circle = new Circle(...center, 6);
		let center3Circle = new Circle(...center, 3);
		let in3Center = false;
		let opponent6Center = false;
		let opponent3Center = false;

		for(let unit of state.players[state.player].units) {
			const modelsOnBattlefield = unit.models.filter(modelId => onBattlefield(state.models[modelId]));
			in3Center = modelsOnBattlefield.length > 0 && modelsOnBattlefield.some(modelId => center3Circle.include(...state.models[modelId]));
			if (in3Center) {
				break;
			}
		}

		for(let unit of state.players[opponentPlayer].units) {
			const modelsOnBattlefield = unit.models.filter(modelId => onBattlefield(state.models[modelId]));
			if (!opponent6Center) {
				opponent6Center = modelsOnBattlefield.length > 0 && modelsOnBattlefield.some(modelId => center6Circle.include(...state.models[modelId]));
			}
			opponent3Center = modelsOnBattlefield.length > 0 && modelsOnBattlefield.some(modelId => center3Circle.include(...state.models[modelId]));
			if (opponent3Center)  {
				break;
			}
		}

		if (in3Center && !opponent3Center) {
			secondaryVP += 2;
		}

		if (in3Center && !opponent6Center) {
			secondaryVP += 3;
			completed = true;
		}
		return { completed, secondaryVP };
	}
}

class DefendStronhold {
	static scoreSecondaryVP(state, profiles, categories) {
		const playerDeployment = new deployment[state.battlefield.deployment];
		const ownDelploymentMarker = playerDeployment.deploy_markers[activePlayerId] ?? [NaN, NaN];
		let completed = false;
		let secondaryVP = 0;
		let markerControl = 0;
		state.players.forEach((player, modelPlayerId) => {
			player.models.forEach(modelId => {
				const modelPosition = state.models[modelId];
				if (len(sub(modelPosition, ownDelploymentMarker)) <= playerDeployment.objective_marker_control_distance) {
					const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
					const oc = profiles[modelId].oc * ocSign;
					markerControl += oc;
				}
			})
		});

		if (markerControl > 0) {
			secondaryVP += 3;
			completed = true;
		}
		return { completed, secondaryVP };
	}
}

class ExtendBattleLines {
	static scoreSecondaryVP(state, profiles, categories) {
		const playerDeployment = new deployment[state.battlefield.deployment];
		const objectiveControl = Array(playerDeployment.nomansland_markers.length).fill(0);
		let completed = false;
		let secondaryVP = 0;
		state.players.forEach((player, modelPlayerId) => {
			player.models.forEach(modelId => {
				playerDeployment.nomansland_markers.forEach((markerPosition, i) => {
					const modelPosition = state.models[modelId];
					if (len(sub(modelPosition, markerPosition)) <= playerDeployment.objective_marker_control_distance) {
						const ocSign = modelPlayerId === activePlayerId ? 1 : -1;
						const oc = profiles[modelId].oc * ocSign;
						objectiveControl[i] += oc;
					}
				});
			})
		});
		const markerControlCounter = objectiveControl.filter(oc => oc > 0).length;
		if (markerControlCounter >= 2) {
			secondaryVP += 3;
		}
		if(markerControlCounter >= 1) {
			secondaryVP += 2;
			completed = true;
		}

		return { completed, secondaryVP };
	}
}

class RecoverAssets {
	static scoreSecondaryVP(state, profiles, categories) {
		return { completed: true, secondaryVP: 0 };
	}
}

class Assassination {
	static scoreSecondaryVP(state, profiles, categories) {
		return { completed: false, secondaryVP: 0 };
	}
}
class NoPrisoners {
	static scoreSecondaryVP(state, profiles, categories) {
		return { completed: false, secondaryVP: 0 };
	}
}

class OverwhelmingForce {
	static scoreSecondaryVP(state, profiles, categories) {
		return { completed: false, secondaryVP: 0 };
	}
}

class StormHostileObjective {
	static scoreSecondaryVP(state, profiles, categories) {
		return { completed: false, secondaryVP: 0 };
	}
}

class BringItDown {
	static scoreSecondaryVP(state, profiles, categories) {
		return { completed: false, secondaryVP: 0 };
	}
}

class CullTheHorde {
	static scoreSecondaryVP(state, profiles, categories) {
		return { completed: false, secondaryVP: 0 };
	}
}

class Containment {
	static scoreSecondaryVP(state, profiles, categories) {
		return { completed: false, secondaryVP: 0 };
	}
}

class MarketForDeath {
	static scoreSecondaryVP(state, profiles, categories) {
		return { completed: false, secondaryVP: 0 };
	}
}

class Sabotage {
	static scoreSecondaryVP(state, profiles, categories) {
		return { completed: false, secondaryVP: 0 };
	}
}

export const missionMap = {
	[Mission.BehindEnemyLines]: BehindEnemyLines,
	[Mission.EngageOnAllFronts]: EngageOnAllFronts,
	[Mission.Cleanse]: Cleanse,
	[Mission.EstablishLocus]: EstablishLocus,
	[Mission.SecureNoMansLand]: SecureNoMansLand, 
	[Mission.AreaDenial]: AreaDenial,
	[Mission.DefendStronhold]: DefendStronhold,
	[Mission.ExtendBattleLines]: ExtendBattleLines,
	[Mission.RecoverAssets]: RecoverAssets,
	[Mission.Assassination]: Assassination,
	[Mission.NoPrisoners]: NoPrisoners,
	[Mission.OverwhelmingForce]: OverwhelmingForce, 
	[Mission.StormHostileObjective]: StormHostileObjective,
	[Mission.BringItDown]: BringItDown,
	[Mission.CullTheHorde]: CullTheHorde,
	[Mission.Containment]: Containment,
	[Mission.MarketForDeath]: MarketForDeath,
	[Mission.Sabotage]: Sabotage,
}

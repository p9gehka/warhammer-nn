import { Warhammer, Phase } from '../static/environment/warhammer.js';
import { PlayerDumb } from '../static/players/player-dumb.js';
import { filterObjByKeys } from '../static/utils/index.js';
import { PlayerAgent } from '../static/players/player-agent.js';
import { PlayerEasy } from '../static/players/player-easy.js';
import { PlayerEasyShoot } from '../static/players/player-easy-shoot.js';
import { Rewarder } from '../students/student.js';
import { MovingAverager } from '../moving-averager.js';

import config from '../config.json' assert { type: 'json' };
import gameSettings from '../static/settings/game-settings.json' assert { type: 'json' };
import allBattlefields from '../static/settings/battlefields.json' assert { type: 'json' };

let battlefields = config.battlefields.length > 0 ? filterObjByKeys(allBattlefields, config.battlefields) : allBattlefields;

const rewardAveragerLen = 200;

export async function testReward(silent, nn) {
	const env = new Warhammer({ gameSettings, battlefields });
	const players = [new PlayerEasy(0, env), new PlayerEasy(1, env)];
	if (nn !== undefined) {
		players[0] = new PlayerAgent(0, env);
	}
	// players[0].setAgent("moveToFreeObject")
	players[0].agents[Phase.Movement].onlineNetwork = nn;
	const rewarder = new Rewarder(env, players[0]);

	if (nn === undefined) {
		try {
			await players[0].load();
		} catch(e) {
			console.log(e.message);
		}
	}

	let state = env.reset();
	players.forEach(player => player.reset());

	let averageVPBest = -Infinity;
	const vpAverager = new MovingAverager(rewardAveragerLen);
	const rewardAverager = new MovingAverager(rewardAveragerLen);

	let frameCount = 0;
	let prevState;
	while (true) {
		state = env.getState();

		if (state.done) {
			vpAverager.append(state.players[0].primaryVP);
			rewardAverager.append(rewarder.cumulativeReward);

			const averageVP = vpAverager.average();
			const averageReward = rewardAverager.average();
			if (!silent) {
				console.log(
					`Frame #${frameCount}: ` +
					`cumulativeVP${rewardAveragerLen}=${averageVP.toFixed(1)}; ` +
					`cumulativeReward${rewardAveragerLen}=${averageReward.toFixed(1)}; ` +
					`(epsilon=${players[0].epsilon?.toFixed(3)}) `
				);
			}

			state = env.reset();
			rewarder.reset();
			players.forEach(agent => agent.reset());
		}

		const stepInfo = players[state.player].playStep();
		if (state.player === 0) {
			if (prevState !== undefined) {
				rewarder.step(prevState[0], prevState[1], 0);
			}
			prevState = [state, ...stepInfo]
		}
		if (state.player === 0) {
			frameCount++;
		}

		if (vpAverager.length === rewardAveragerLen) {
			break;
		}
	}
	return vpAverager.average();
}

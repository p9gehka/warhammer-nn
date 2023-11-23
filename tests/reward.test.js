import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';
import { ControlledAgent } from '../agents/controlled-agent.js';
import battlefields from './mock/battlefields.json' assert { type: 'json' };
import gameSettings from './mock/game-settings.json' assert { type: 'json' };

describe('reward', () => {
	const env = new Warhammer({ gameSettings, battlefields });
	const players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	const agents = [new ControlledAgent(players[0]), new ControlledAgent(players[1])];

	it('count object reward', () => {
		let state = env.reset();
		while (true) {
			state = env.getState();
			if (state.done) {
				break
			}
			agents[state.player].playStep(0);
			agents[state.player].playStep(0);
		}
		expect(players[0].cumulativeReward).toBe(50);
	});

	it('count wipe reward', () => {
		let state = env.reset();
		players.forEach(p => p.reset())
		while (true) {
			state = env.getState();
			if (state.done) {
				break
			}
			agents[state.player].playStep(0);
			if (state.player === 0) {
				agents[state.player].playStep(1);
				agents[state.player].playStep(31);
				agents[state.player].playStep(2);
				agents[state.player].playStep(31);
			}
			agents[state.player].playStep(0);
		}
		expect(players[0].cumulativeReward).toBe(53);
	});
});

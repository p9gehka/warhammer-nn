import { Warhammer } from '../static/environment/warhammer.js';
import { PlayerEnvironment } from '../static/environment/player-environment.js';
import { ControlledAgent } from '../static/agents/controlled-agent.js';

import battlefields from './mock/battlefields.json' assert { type: 'json' };
import gameSettings from './mock/game-settings.json' assert { type: 'json' };

describe('reward', () => {
	const env = new Warhammer({ gameSettings, battlefields });
	const players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	const agents = [new ControlledAgent(players[0]), new ControlledAgent(players[1])];

	beforeEach(() => {
		env.reset();
		agents.forEach(agent => agent.reset());
	});

	it('count object reward', () => {
		while (true) {
			const state = env.getState();
			if (state.done) {
				break;
			}
			agents[state.player].nextPhaseWorkaround();
		}
		expect(players[0].cumulativeReward).toBe(19.5);
	});
	it('count move penalty', () => {
		const state = env.getState();
		agents[state.player].playStep(3);
		expect(players[0].cumulativeReward).toBe(1);
		agents[state.player].playStep(5);
		expect(players[0].cumulativeReward).toBe(0);
	});

	it('count penalty', () => {
		while (true) {
			let state = env.getState();

			if (state.done) {
				agents.forEach(agent => agent.awarding());
				break;
			}

			if (state.player === 0) {
				console.log(players[0].cumulativeReward);
				agents[0].playStep(8);
			}
			agents[state.player].nextPhaseWorkaround();
		}
		expect(players[0].cumulativeReward).toBe(-76.1);
	});
});

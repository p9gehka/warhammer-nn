import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';
import { ControlledAgent } from '../agents/controlled-agent.js';
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
			agents[state.player].playStep(0);
			agents[state.player].playStep(0);
		}
		expect(players[0].cumulativeReward).toBe(30);
	});
	it('count move penalty', () => {
		const state = env.getState();
		agents[state.player].playStep(1);
		agents[state.player].playStep(3);
		expect(players[0].cumulativeReward).toBe(3);
		agents[state.player].playStep(5);
		expect(players[0].cumulativeReward).toBe(2);
	});

	it('count wipe reward', () => {
		while (true) {
			const state = env.getState();
			if (state.done) {
				agents.forEach(agent => agent.awarding());
				break;
			}
			agents[state.player].playStep(0);
			if (state.player === 0) {
				agents[0].playStep(1);
				agents[0].playStep(31);
				agents[0].playStep(2);
				agents[0].playStep(31);
			}
			agents[state.player].playStep(0);
		}
		expect(players[0].cumulativeReward).toBe(55.5);
		expect(players[1].cumulativeReward).toBe(-50);
	});
	it('count penalty', () => {
		while (true) {
			const state = env.getState();
			if (state.done) {
				agents.forEach(agent => agent.awarding());
				break;
			}

			if (state.player === 0) {
				agents[0].playStep(1);
				agents[0].playStep(26);
				agents[0].playStep(2);
				agents[0].playStep(27);
			}
			agents[state.player].playStep(0);
			agents[state.player].playStep(0);
		}
		expect(players[0].cumulativeReward).toBe(-28.5);
	});
});

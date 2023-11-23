import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';
import { ControlledAgent } from '../agents/controlled-agent.js';

describe('reward', () => {
	it('count object reward', () => {
		 const testBattlefield = {
			"size": [44, 30],
			"ruins": [[[5, 7], [5, 17]], [[28, 15], [38, 15]], [[22, 10], [22, 20]], [[39, 13], [39, 23]], [[6, 15], [16, 15]]],
			"deploment": [],
			"objective_marker": [[8, 15], [22, 7], [22, 23], [36, 15]],
			"objective_marker_control_distance": 3,
		};

		const gameSettings = {
			"units": [
				[
					{ "name": "strike_team", "models": [0] },
					{ "name": "strike_team", "models": [1] }
				],
				[
					{ "name": "strike_team", "models": [2] },
					{ "name": "strike_team", "models": [3] }
				]
			],
			"models": [
				[8, 15], [22,7],
				[34,26],[32,26]
			],
			"primary_objective": "take_and_hold",
			"objective_marker_control_distance": 3,
		};

		const env = new Warhammer({ gameSettings, battlefields: { testBattlefield }});
		const players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
		const agents = [new ControlledAgent(players[0]), new ControlledAgent(players[1])];

		let state = env.reset();
		while (true) {
			state = env.getState();
			if (state.done) {
				break
			}
			agents[state.player].playStep(0);
		}
		expect(players[0].cumulativeReward).toBe(50);
	});
});
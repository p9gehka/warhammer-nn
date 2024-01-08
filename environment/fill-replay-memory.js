import { PlayerEnvironment } from './player-environment.js';
import { RandomAgent } from '../agents/random-agent0.2.js';

export function fillReplayMemory(env, replayMemory, agents) {
	if (agents === undefined) {
		agents = [
			new RandomAgent(new PlayerEnvironment(0, env), { replayMemory }),
			new RandomAgent(new PlayerEnvironment(1, env), { replayMemory })
		];
	}

	let state = env.reset();
	while (replayMemory.length < replayMemory.maxLen) {
		state = env.getState();
		if (state.done) {
			agents.forEach(agent => agent.awarding())

			state = env.reset();
			agents.forEach(agent => agent.reset());
		}
		agents[state.player].playStep();
	}
}

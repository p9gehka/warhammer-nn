import { Warhammer, BaseAction, Phase } from '../environment/warhammer.js';
import battlefields from './mock/battlefields.json' assert { type: 'json' };
import gameSettings from './mock/game-settings.json' assert { type: 'json' };

describe('warhammer environment', () => {
	it('done', () => {
		const env = new Warhammer({ gameSettings, battlefields });
		env.end();
		expect(env.done()).toBe(true);
		expect(env.getState().done).toBe(true);
	});

	it('phase turn round', () => {
		const env = new Warhammer({ gameSettings, battlefields });
		let state = env.getState()
		expect(state.phase).toBe(Phase.Movement);
		expect(state.turn).toBe(0);
		expect(state.round).toBe(0);
		state = env.step({ action: BaseAction.NextPhase });
		expect(state.phase).toBe(Phase.Shooting);
		expect(state.turn).toBe(0);
		expect(state.round).toBe(0);
		state = env.step({ action: BaseAction.NextPhase });

		expect(state.phase).toBe(Phase.Movement);
		expect(state.turn).toBe(1);
		expect(state.round).toBe(0);

		state = env.step({ action: BaseAction.NextPhase });
		state = env.step({ action: BaseAction.NextPhase });
		expect(state.phase).toBe(Phase.Movement);
		expect(state.turn).toBe(2);
		expect(state.round).toBe(1);
	});
});
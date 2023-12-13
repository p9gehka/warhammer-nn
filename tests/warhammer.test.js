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

	it('phase', () => {
		const env = new Warhammer({ gameSettings, battlefields });
		let state = env.getState()
		expect(state.phase).toBe(Phase.Movement);
		state = env.step({ action: BaseAction.NextPhase });
		expect(state.phase).toBe(Phase.Shooting);
	});
});
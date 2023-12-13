import { Warhammer } from '../environment/warhammer.js';
import battlefields from './mock/battlefields.json' assert { type: 'json' };
import gameSettings from './mock/game-settings.json' assert { type: 'json' };

describe('warhammer environment', () => {
	it('done', () => {
		const env = new Warhammer({ gameSettings, battlefields });
		env.end();
		expect(env.done()).toBe(true);
		expect(env.getState().done).toBe(true);
	});
});
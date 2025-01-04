import { Warhammer } from '../static/environment/warhammer.js';
import { emptyInput } from '../static/environment/nn-input.js';
import battlefields from './mock/battlefields.json' assert { type: 'json' };
import gameSettings from './mock/game-settings.json' assert { type: 'json' };

describe('get state tensor', () => {
	it('state tensor test', () => {
		/*
		const input = emptyInput();
		const env = new Warhammer({ battlefields, gameSettings});
		const ch = 'Stamina';
		input[ch].push([0, 0]);
		const stateTensor = getStateTensor([input], 5, 5, player.channels);
		expect(stateTensor.arraySync()[0][0][0]).toEqual([0, player.channels[1][ch]]);
		*/
	});
});

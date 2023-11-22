import { emptyInput } from '../environment/player-environment.js';
import { getStateTensor } from '../agents/utils.js';
import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';

describe('get state tensor', () => {
	it('state tensor test', () => {
		const input = emptyInput();

		const env = new Warhammer();
		const player = new PlayerEnvironment(0, env)
		const ch = 'SelfModelAvailableToMove';
		input[ch].push([0, 0])
		const stateTensor = getStateTensor([input], 44, 30, player.channels);
		expect(stateTensor.arraySync()[0][0][0]).toEqual([0, player.channels[1][ch], 0]);
	});
});

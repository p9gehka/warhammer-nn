import { emptyInput } from '../environment/player-environment.js';
import { getStateTensor } from '../agents/utils.js';
import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';

describe('get state tensor', () => {
	it('state tensor test', () => {
		const input = emptyInput();
		const env = new Warhammer();
		const player = new PlayerEnvironment(0, env);
		const ch = 'SelfModelAvailableToMove';
		input[ch].push([0, 0])
		const stateTensor = getStateTensor([input], 5, 5, player.channels);
		expect(stateTensor.arraySync()[0][0][0]).toEqual([player.channels[0][ch], 0, 0]);
	});
});

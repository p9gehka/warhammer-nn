import { Warhammer } from '../static/environment/warhammer.js';
import { Action } from '../static/environment/orders.js';
import { PlayerEnvironment } from '../static/environment/player-environment.js';

describe('getInput', () => {
	it('getInput', () => {
		const env = new Warhammer();
		const player = new PlayerEnvironment(0, env);
		env.reset();
		const input = player.getInput();
		for (let key in player.getInput()) {
			input[key].flat().forEach(coord => {
				expect(coord).toBeInstanceOf(Number);
			});
		}
	});

	it('move orders vector integer', () => {
		 const env = new Warhammer();
		 const player = new PlayerEnvironment(0, env);
		 env.reset();

		 expect(player.orders[Action.Move].map(action => action.vector).flat().every(Number.isInteger)).toBeTrue();
	});
});

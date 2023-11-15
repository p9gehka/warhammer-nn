import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';

describe('getInput', () => {
  it('getInput', () => {
     const env = new Warhammer();
     const player = new PlayerEnvironment(0, env)
     env.reset();
     const input = player.getInput();
     for (let key in player.getInput()) {
     	input[key].flat().forEach(coord => {
     		 expect(coord).toBeInstanceOf(Number);
     	});
     }
  });
});
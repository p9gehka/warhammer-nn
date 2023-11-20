import { Warhammer } from '../environment/warhammer.js';
import { PlayerEnvironment } from '../environment/player-environment.js';
import { GameAgent } from '../agents/game-agent0.1.js';

describe('game agent', () => {
  it('order', () => {
     const env = new Warhammer();
     const player = new PlayerEnvironment(0, env);
     const gameAgent = new GameAgent(player);
     let action = null;
     player.step = (order) => action = order.action;

     gameAgent.playStep();
     expect(action).toMatch(/NEXT_PHASE|SELECT$/);
  });
});
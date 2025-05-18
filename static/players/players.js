import { PlayerAgent } from './player-agent.js';
import { PlayerComputerSimple1 } from './player-computer-simple1.js'
import { PlayerControlled } from './player-controlled.js';
import { PlayerDumb } from './player-dumb.js';

export const players = {
	[PlayerAgent.name]: PlayerAgent,
	[PlayerControlled.name]: PlayerControlled,
	[PlayerComputerSimple1.name]: PlayerComputerSimple1,
	[PlayerDumb.name]: PlayerDumb,
};

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Warhammer, Phase } from './static/environment/warhammer.js';
import { PlayerAgent } from './static/players/player-agent.js';
import { Rewarder } from './students/student.js';
import { filterObjByKeys } from './static/utils/index.js';
import { PlayerEasy } from './static/players/player-easy.js';
import { PlayerEasyShoot } from './static/players/player-easy-shoot.js';

import gameSettings from './static/settings/game-settings.json' assert { type: 'json' };
import allBattlefields from './static/settings/battlefields.json' assert { type: 'json' };

import config from './config.json' assert { type: 'json' };
import * as tf from '@tensorflow/tfjs-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const savePath = './static/models/dqn';

let battlefields = config.battlefields.length > 0 ? filterObjByKeys(allBattlefields, config.battlefields) : allBattlefields;

app.use(express.json())
app.use(express.static(__dirname + '/static'));

app.get('/', (req,res) => res.sendFile('static/index.html', { root: __dirname }));
app.get('/game', (req,res) => res.sendFile('static/game.html', { root: __dirname }));
app.get('/dataset', (req,res) => res.sendFile('static/dataset.html', { root: __dirname }));

app.post('/play', async (req,res) => {
	const env = new Warhammer({ gameSettings, battlefields });
	const players = [new PlayerAgent(0, env), new PlayerEasy(1, env)];
	const rewarders = [new Rewarder(env, players[0]), new Rewarder(env, players[1])];
	try {
		await Promise.all(players.map(player => player.load()));
	} catch(e) {
		console.log(e.message);
	}
	let state = env.reset();
	let attempts = 0;
	const actionsAndStates = [[state, players[state.player].getState(), null, state]];
	const states = [];

	let prevState = [undefined, undefined];
	let prevStates = [[], []];

	while (!state.done && attempts < 500) {
		state = env.getState();

		if (prevState[state.player] !== undefined) {
			let reward = rewarders[state.player].step(prevState[state.player][0], prevState[state.player][2], 0.5);
			prevStates[state.player].push([...prevState[state.player], reward]);
			if (prevState[state.player][2].action === 'NEXT_PHASE' && state.phase === Phase.Command) {
				actionsAndStates.push(...prevStates[state.player]);
				prevStates[state.player] = [];
			}
		}

		const stepInfo = players[state.player].playStep();
		prevState[state.player] = [state, players[state.player].getState(), ...stepInfo];

		attempts++;
	}
	console.log(`cumulativeReward: ${rewarders[0].cumulativeReward} VP: ${state.players[0].primaryVP}`)
	res.json(actionsAndStates)
});

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});
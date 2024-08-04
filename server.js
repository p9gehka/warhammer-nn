import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Warhammer } from './static/environment/warhammer.js';
import { PlayerAgent } from './static/players/player-agent.js';
import { Rewarder } from './students/student.js';
import { filterObjByKeys } from './static/utils/index.js';

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

app.post('/play', async (req,res) => {
	console.log(`Load model from ${`file://${savePath}/model.json`} success`);
	const env = new Warhammer({ gameSettings, battlefields });
	const players = [new PlayerAgent(0, env), new PlayerAgent(1, env)];
	const rewarders = [new Rewarder(0, env), new Rewarder(1, env)];
	try {
		await Promise.all(players.map(player => player.load()));
	} catch(e) {
		console.log(e.message);
	}
	let state = env.reset();
	let attempts = 0;
	const actionsAndStates = [[state, null, state]];
	const states = [];

	while (!state.done && attempts < 100) {
		state = env.getState();
		const stepInfo = players[state.player].playStep();
		let reward = rewarders[state.player].step(stepInfo[0], 0.5);

		actionsAndStates.push([state, ...stepInfo, reward])
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
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Warhammer, Phase } from './static/environment/warhammer.js';
import { PlayerEnvironment } from './static/environment/player-environment.js';
import { DumbAgent } from './static/agents/dumb-agent.js';
import { GameAgent } from './static/agents/game-agent0.1.js';
import { TestAgent } from './static/agents/test-agent.js';

import * as tf from '@tensorflow/tfjs-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const savePath = './static/models/dqn/temp';

app.use(express.json())
app.use(express.static(__dirname + '/static'));

app.get('/', (req,res) => res.sendFile('static/index.html', { root: __dirname }));
app.get('/game', (req,res) => res.sendFile('static/game.html', { root: __dirname }));

app.get('/game/init', async (req,res) => {
	const onlineNetwork = await tf.loadLayersModel(`file://${savePath}/model.json`);
	const env = new Warhammer();
	const players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	let state = env.reset();
	agents.forEach(a => a.reset());
});

app.post('/play', async (req,res) => {
	const onlineNetwork = await tf.loadLayersModel(`http://192.168.0.107/dqn-share/model.json`);
	const env = new Warhammer();

	const players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
	let agents = [new TestAgent(players[0], { nn: onlineNetwork }), new TestAgent(players[1], { nn: onlineNetwork })];
	let state = env.reset();
	agents.forEach(a => a.reset());
	let attempts = 0;
	const actionsAndStates = [[state, null, state]];
	const states = [];

	while (!state.done && attempts < 100) {
		 state = env.getState();
		 if (state.done) {
			 agents.forEach(agent => agent.awarding());
			 break;
		 }
		 const stepInfo = agents[state.player].playStep();

		 actionsAndStates.push([state, ...stepInfo])
		 attempts++;
	}
	console.log('cumulativeReward', players[0].cumulativeReward)
	res.json(actionsAndStates)
});

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});
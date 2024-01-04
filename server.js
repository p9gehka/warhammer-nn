import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Warhammer, Phase } from './environment/warhammer.js';
import { PlayerEnvironment, Action } from './environment/player-environment.js';
import { RandomAgent } from './agents/random-agent0.1.js';
import { GameAgent } from './agents/game-agent0.1.js';
import { TestAgent } from './agents/test-agent.js';

import * as tf from '@tensorflow/tfjs-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const savePath = './models/dqn/';

app.use(express.json())
app.use(express.static(__dirname + '/static'));

app.get('/', (req,res) => res.sendFile('static/index.html', { root: __dirname }));

app.post('/play', async (req,res) => {
  const onlineNetwork = await tf.loadLayersModel(`file://${savePath}/model.json`);
  const env = new Warhammer();

  const players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
  let agents = [new TestAgent(players[0], { nn: [onlineNetwork] }), new RandomAgent(players[1])]
  let state = env.reset();
  agents.forEach(a => a.reset());
  let attempts = 0;
  const actionsAndStates = [[null, state]];
  const states = [];

  while (!state.done && attempts < 100) {
     state = env.getState();
     if (state.done) {
       agents.forEach(agent => agent.awarding());
       break;
     }
     const stepInfo = agents[state.player].playStep();
     actionsAndStates.push(stepInfo)
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
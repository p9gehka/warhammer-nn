import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Warhammer, Phase, Action } from './environment/warhammer.js';
import { PlayerEnvironment } from './environment/player-environment.js';
import { RandomAgent } from './agents/random-agent0.1.js';
import { GameAgent } from './agents/game-agent0.1.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

app.use(express.json())
app.use(express.static(__dirname + '/static'));

app.get('/',function(req,res) {
  res.sendFile('static/index.html', { root: __dirname });
});


app.post('/play',function(req,res) {
  const env = new Warhammer();
  const players = [new PlayerEnvironment(0, env), new PlayerEnvironment(1, env)];
  let agents = [new GameAgent(players[0]), new RandomAgent(players[1])]
  let state = env.reset();
  let attempts = 0;

  const actionsAndStates = [[null, state]];
  const states = [];
  while (!state.done && attempts < 500) {
     state = env.getState();
     if (state.done) {
       break;
     }
     const order = agents[state.player].playStep();
     actionsAndStates.push(order)
     attempts++;
     console.log(state.turn)
   }
  res.json(actionsAndStates)
});



const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
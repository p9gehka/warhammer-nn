import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Warhammer, Phase, Action } from './environment/warhammer.js';
import { PlayerEnvironment } from './environment/player-environment.js';
import { RandomAgent } from './agents/random-agent0.2.js';

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

  let agent = new RandomAgent();

  let state = env.reset();
  let done = false;
  let attempts = 0;
  const actionsAndStates = [[null, state]];
  const states = [];

  while (!state.done && attempts < 500) {
     const playerEnvironment = players[state.player];
     const order = agent.playStep(playerEnvironment.getInput44x30());
     state = env.getState();
     done = state.done;
     if (state.done) {
       break;
     } 

     if (state.phase === Phase.Movement) {
       if (state.availableToMove.length === 0) {
          env.step({action: Action.NextPhase })
       }
       if (order.action === Action.Move) {
         actionsAndStates.push(playerEnvironment.step(order))
       }
     }


     if (state.phase === Phase.Shooting) {
       if (state.availableToShoot.length === 0) {
         env.step({action: Action.NextPhase});
       }
       if (order.action === Action.Shoot) {
         actionsAndStates.push(playerEnvironment.step(order));
       }
     }

     attempts++;
   }
  res.json(actionsAndStates)
});



const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
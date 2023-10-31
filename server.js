import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Warhammer, Phase } from './environment/warhammer.js';
import { RandomAgent } from './agents/random-agent0.1.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const env = new Warhammer();
const app = express();

app.use(express.json())
app.use(express.static(__dirname + '/static'));

app.get('/',function(req,res) {
  res.sendFile('static/index.html', { root: __dirname });
});


app.post('/play',function(req,res) {
  const env = new Warhammer();
  let agent = new RandomAgent();

  let state = env.reset();
  let done = false;
  let attempts = 0;
  const actionsAndStates = [[null, state]];
  const states = [];
  while (!state.done && attempts < 500) {
   done = state.done;
   if (state.phase === Phase.Movement) {
     const [action, id, vector] = agent.playStep();

     if (action === "MOVE") {
       const order = {action, id:(id + 2 * state.player), vector}
       state = env.step(order);
       actionsAndStates.push([order, state])
     }

     if (state.availableToMove.length === 0) {
       state = env.step({action: "NEXT_PHASE"})
     }
   }


   if (state.phase === Phase.Shooting) {
     const [action, id, target] = agent.playStep();
    
     if (action === "SHOOT") {
       let order = { action, id, target };
       if (state.player === 1) {
         order = { action, id: target, target: id }
       }
       state = env.step(order);

       actionsAndStates.push([order, state]);
     }

     if (state.availableToShoot.length === 0) {
       state = env.step({action: "NEXT_PHASE"});
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
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Warhammer } from './environment/warhammer.js';
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
  console.log(state)
  const actionsAndStates = [[null, state]];
  const states = []
  while (!state.done && attempts < 500) {
    done = state.done;
    const [id, vector] = agent.playStep();
    const action = {action: "MOVE", id:(id + 2 * state.player), vector}
    state = env.step(action);

    actionsAndStates.push([action, state])
    if (state.availableToMove.length === 0) {
      env.step({action: "NEXT_PHASE"})
      state = env.step({action: "NEXT_PHASE"})
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
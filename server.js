import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Warhammer from './environment/warhammer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const env = new Warhammer();
const app = express();

app.use(express.json())
app.use(express.static(__dirname + '/static'));

app.get('/',function(req,res) {
  res.sendFile('static/index.html', { root: __dirname });
});

app.post('/reset',function(req,res) {
  res.json(env.reset())
});

app.post('/step',function(req,res) {
  res.json(env.step(req.body))
});


const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
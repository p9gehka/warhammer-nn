import express from 'express';
import { ReplayMemory } from './replay-memory.js';
import hash from 'object-hash';
import config from '../config.json' assert { type: 'json' };
const { replayMemorySize } = config;
const replayMemory = new ReplayMemory(replayMemorySize);

const app = express();

let locked = false;
app.use(express.json({ limit: '50mb' }));

app.get('/', (req,res) => {
	if (locked) {
		res.sendStatus(423);
		return;
	}
	res.sendStatus(200);
});



app.post('/append', (req,res) => {
	if (locked) {
		res.sendStatus(423);
		return;
	}
	req.body.buffer.forEach(item => replayMemory.append(item));
	console.log(`Memory updated, size: ${replayMemory.length}`);
	res.sendStatus(200);
});

app.get('/sample', (req,res) => {
	if (locked) {
		res.sendStatus(423);
		return;
	}
	const batchSize = parseInt(req.query.batchSize);

	if (replayMemory.length !== replayMemorySize) {
		res.json({ buffer: replayMemory.sample(batchSize) });
		return;
	}
	if (isNaN(batchSize)) {
		res.sendStatus(400);
		return;
	}
	res.json({ buffer: replayMemory.sample(batchSize) });
});

app.get('/config', (req,res) => res.json(config));
app.get('/model', (req,res) => res.sendFile('static/dqn/model.json', { root: __dirname }));
app.get('/weight', (req,res) => res.sendFile('static/dqn/weight.bin', { root: __dirname }));

const port = 3000;

app.post('/lock', (req, res) => {
	console.log('memory locked');
	locked = true;
	res.sendStatus(200);
});
app.listen(port, () => {
	console.log(`Replay Memory Server running`);
});

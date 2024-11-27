import express from 'express';
import { ReplayMemory } from './replay-memory.js';
import hash from 'object-hash';
import config from '../config.json' assert { type: 'json' };
import { fileURLToPath } from 'url';
import path from 'path';

const { replayMemorySize } = config;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const replayMemory = new ReplayMemory(replayMemorySize);

const app = express();

let locked = false;
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname + '/../static'));

app.get('/get_memory', (req,res) => res.sendFile(path.resolve('./static/memory.html')));

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

app.get('/get', (req,res) => {
	const from_ = parseInt(req.query.from);
	const perPage = parseInt(req.query.perPage);

	if (isNaN(from_) || isNaN(perPage)) {
		res.sendStatus(400);
		return;
	}
	res.json({ buffer: replayMemory.buffer.slice(from_, from_ + perPage) });
});

app.get('/key-counter', (req,res) => {
	res.json(replayMemory.keyCounter);
});

app.get('/config', (req,res) => res.json(config));


app.post('/lock', (req, res) => {
	console.log('memory locked');
	locked = true;
	res.sendStatus(200);
});

const port = 3000;

app.listen(port, () => {
	console.log(`Replay Memory Server running`);
});

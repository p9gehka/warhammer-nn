import express from 'express';
import { ReplayMemory } from './replay-memory.js';

const replayBufferSize = 4e4;
const replayMemory = new ReplayMemory(replayBufferSize);
const app = express();

app.use(express.json({ limit: '50mb' }));

app.get('/', (req,res) => res.sendStatus(200));
app.post('/append', (req,res) => {
	req.body.buffer.forEach((item) => replayMemory.append(item));
	console.log(`Memory updated, size: ${replayMemory.length}`)
	res.sendStatus(200);
});
app.get('/sample', (req,res) => {
	const batchSize = parseInt(req.query.batchSize);

	if (replayMemory.length !== replayBufferSize) {
		res.json({ buffer: replayMemory.sample(batchSize) });
		return;
	}
	if (isNaN(batchSize)) {
		res.sendStatus(400);
		return;
	}
	res.json({ buffer: replayMemory.sample(batchSize) });
});

app.get('/model', (req,res) => res.sendFile('static/dqn/model.json', { root: __dirname }));
app.get('/weight', (req,res) => res.sendFile('static/dqn/weight.bin', { root: __dirname }));

const port = 3000;

app.listen(port, () => {
	console.log(`Replay Memory Server running`);
});

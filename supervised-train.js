import * as fs from 'fs';
import { getTF } from './static/utils/get-tf.js';
import { run } from './supervised/main.js';

const tf = await getTF();
const savePath = './models/supervised-dqn/';
async function main() {
	let nn;
	if (fs.existsSync(`${savePath}/loading/model.json`)) {
		try {
			nn = await tf.loadLayersModel(`file://${savePath}/loading/model.json`);

			nn.layers[0].trainable = false;
			console.log(`Loaded from ${savePath}/loading/model.json`);
		} catch (e) {
			console.log(e.message);
		}
	}
	await run(200, 50, './models/supervised-dqn/', nn);
	process.exit(0);
	return;
}

main();

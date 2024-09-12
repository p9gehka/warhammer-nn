import * as fs from 'fs';
import { getTF } from './static/utils/get-tf.js';
import { train } from './supervised/supervised-train.js';

const tf = await getTF();
const savePath = '../models/supervised-dqn/';
async function main() {
	let nn;
	if (fs.existsSync(`${savePath}/loading/model.json`)) {
		try {
			nn = await tf.loadLayersModel(`file://${savePath}/loading/model.json`);
			console.log(`Loaded from ${savePath}/loading/model.json`);
		} catch (e) {
			console.log(e.message);
		}
	}
	await train(nn);
	process.exit(0);
	return;
}

main();

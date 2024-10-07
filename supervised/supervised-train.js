import * as fs from 'fs';
import { getTF } from '../static/utils/get-tf.js';
import { run } from './main.js';

import config from './config.json' assert { type: 'json' };

const { epochs, batchesPerEpoch, savePath } = config;
const tf = await getTF();

async function main() {
	let nn;
	if (fs.existsSync(`${savePath}/loading/model.json`)) {
		try {
			nn = await tf.loadLayersModel(`file://${savePath}/loading/model.json`);
			const freezeLayers = [0, 2];
			console.log(`Block ${freezeLayers.length} layers`)
			for (let i =0; i <= freezeLayers.length; i++) {
				nn.layers[freezeLayers[i]].trainable = false;
			}

			console.log(`Loaded from ${savePath}/loading/model.json`);
		} catch (e) {
			console.log(e.message);
		}
	}
	await run(epochs, batchesPerEpoch, savePath, nn);
	process.exit(0);
	return;
}

main();

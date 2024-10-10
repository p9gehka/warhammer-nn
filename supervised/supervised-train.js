import * as fs from 'fs';
import { getTF } from '../static/utils/get-tf.js';
import { run } from './main.js';

import config from './config.json' assert { type: 'json' };

const { epochs, batchesPerEpoch, savePath, freezeLayers } = config;
const tf = await getTF();

async function main() {
	let nn;
	if (fs.existsSync(`${process.argv[2]}/loading/model.json`)) {
		try {
			nn = await tf.loadLayersModel(`file://${process.argv[2]}/model.json`);
			console.log(`Block ${freezeLayers} layers`)
			console.log(`Loaded from ${process.argv[2]}/model.json`);
			console.log(`Freese layers - ${freezeLayers} `)

			freezeLayers.forEach(layerName => {
				nn.getLayer(layerName).trainable = false
			});
		} catch (e) {
			console.log(e.message);
		}
	}
	await run(epochs, batchesPerEpoch, savePath, nn);
	process.exit(0);
	return;
}

main();

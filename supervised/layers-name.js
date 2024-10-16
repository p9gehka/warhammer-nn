import * as fs from 'fs';
import { getTF } from '../static/utils/get-tf.js';


const tf = await getTF();

async function main() {

	if (fs.existsSync(`${process.argv[2]}/model.json`)) {
		try {
			const nn = await tf.loadLayersModel(`file://${process.argv[2]}/model.json`);
			console.log(nn.layers.map(layer => layer.name).join())
	
		} catch (e) {
			console.log(e.message);
		}
	}

	process.exit(0);
	return;
}

main();

import * as fs from 'fs';
import { testReward } from './test-reward.js';
import { getTF } from '../static/utils/get-tf.js';

const tf = await getTF();
async function main() {
	let nn = undefined;
	if (fs.existsSync(`${process.argv[2]}/model.json`)) {
		try {
			nn = await tf.loadLayersModel(`file://${process.argv[2]}/model.json`);
		} catch (e) {
			console.log(e.message);
		}
	}

	await testReward(false, nn);
}

main();

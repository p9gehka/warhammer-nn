import { getTF } from '../static/utils/get-tf.js';
import { createDeepQNetwork, copyWeights } from '../dqn/dqn.js';
import { MoveAgent } from '../static/agents/move-agent/move-agent44x30.js';
const tf = await getTF();

async function main() {
	const nn = await tf.loadLayersModel(`file://${process.argv[2]}/model.json`);
	const nn2 = createDeepQNetwork(
		MoveAgent.settings.orders.length,
		MoveAgent.settings.height,
		MoveAgent.settings.width,
		MoveAgent.settings.channels.length,
		{ addSoftmaxLayer: process.argv[4] === "--addSoftmaxLayer" }
	);
	copyWeights(nn2, nn);
	await nn2.save(`file://${process.argv[3]}`);
	process.exit(0);
}

main();
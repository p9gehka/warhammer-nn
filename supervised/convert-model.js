import { getTF } from '../static/utils/get-tf.js';
import { createDeepQNetwork, copyWeights } from '../dqn/dqn.js';
import { MoveAgent } from '../static/agents/move-agent/move-agent44x30.js';
const tf = await getTF();

async function main() {
	const nn = await tf.loadLayersModel(`file://${process.argv[2]}/model.json`);
	const inputShape = nn.input[0].shape;
	const outputShape = nn.output.shape;
	const nn2 = createDeepQNetwork(
		outputShape[1],
		inputShape[1],
		inputShape[2],
		inputShape[3],
		{ addSoftmaxLayer: process.argv[4] === "--addSoftmaxLayer" }
	);
	copyWeights(nn2, nn);
	await nn2.save(`file://${process.argv[3]}`);
	process.exit(0);
}

main();
import { getTF } from '../static/utils/get-tf.js';
import { createDeepQNetwork, copyWeights } from '../dqn/dqn.js';
import { MoveAgent } from '../static/agents/move-agent/move-agent44x30.js';
const tf = await getTF();

const convertModelConfig = {
	"conv2d_Conv2D1": "conv2d_Conv2D1",
	"batch_normalization_BatchNormalization1": "batch_normalization_BatchNormalization1",
}

async function main() {
	const nn = await tf.loadLayersModel(`file://${process.argv[2]}/model.json`);
	const trunkatedBaseOutput = nn.getLayer('conv2d_Conv2D2').output;
	nn.layers.forEach(layer => {
		console.log(layer.name);
	})
	const nn2 = createDeepQNetwork(MoveAgent.settings.orders.length, MoveAgent.settings.height, MoveAgent.settings.width, MoveAgent.settings.channels.length, { inputTransfer: nn.inputs[0], conv2dForTransfer: trunkatedBaseOutput });

	await nn2.save(`file://${process.argv[3]}`);
	process.exit(0);
}

main();
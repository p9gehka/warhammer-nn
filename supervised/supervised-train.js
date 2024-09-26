import { getTF } from '../static/utils/get-tf.js';
import { MoveAgent } from '../static/agents/move-agent/move-center-agent.js';
import { createDeepQNetwork } from '../dqn/dqn.js';
import { getDataset } from '../static/utils/get-dataset.js';


const tf = await getTF();

export async function train(nn) {
	const batchSize = 25;
	const epochs = 50;
	const dataset = getDataset().batch(batchSize);
	const validationDataset = getDataset().batch(20);
	/*
	const countOrders = new Array(MoveAgent.settings.orders.length).fill(0);
	await getDataset().take(2000).shuffle(1000).forEachAsync(e => {
		countOrders[e[1]]++;
	});
	countOrders.forEach((n, i) => console.log(MoveAgent.settings.orders[i], n))
	*/
	const model = createDeepQNetwork(MoveAgent.settings.orders.length, MoveAgent.settings.width, MoveAgent.settings.height, MoveAgent.settings.channels.length)
	model.add(tf.layers.softmax());
	const opimizer = tf.train.adamax(0.06863394)
	model.compile({
		optimizer: opimizer,
		loss: 'categoricalCrossentropy',
		metrics: ['accuracy'],
	});
	model.summary();
	await trainModelUsingFitDataset(model, dataset,validationDataset, epochs, batchSize);
}

export async function trainModelUsingFitDataset(model, dataset, validationData, epochs, batchSize) {
	const fitDatasetArgs = {
		batchesPerEpoch: batchSize,
		epochs: epochs,
		validationData,
		validationBatches: 30,
	};
	return await model.fitDataset(dataset, fitDatasetArgs);
}

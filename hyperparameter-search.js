import { getTF } from './static/utils/get-tf.js';
import { trainModelUsingFitDataset, getDataset } from './supervised/supervised-train.js';
import { MoveAgent } from './static/agents/move-agent/move-center-agent.js';
import { createDeepQNetwork } from './dqn/dqn.js';
import { sendMessage } from './visualization/utils.js';
import * as hpjs from 'hyperparameters';

const tf = await getTF();
const optimizers = {
  sgd: tf.train.sgd,
  adagrad: tf.train.adagrad,
  adam: tf.train.adam,
  adamax: tf.train.adamax,
  rmsprop: tf.train.rmsprop,
}

const batchSize = 25;
const optFunction = async ({ kernelRegularizer1, kernelRegularizer2, kernelRegularizer3 }, { dataset }) => {
	const model = createDeepQNetwork(
		MoveAgent.settings.orders.length, MoveAgent.settings.width, MoveAgent.settings.height, MoveAgent.settings.channels.length,
		[{kernelRegularizer: kernelRegularizer1}, {kernelRegularizer: kernelRegularizer2}, {kernelRegularizer: kernelRegularizer3}]
	);
	model.add(tf.layers.softmax());
	const opimizer = optimizers['adam'](0.00007);
	model.compile({
		optimizer: opimizer,
		loss: 'categoricalCrossentropy',
		metrics: ['accuracy'],
	});

	// train model using defined data

	const h = await trainModelUsingFitDataset(model, dataset);
	sendMessage(`optimizer: ${optimizer} learning rate: ${learningRate}`);
	return { accuracy: h.history.val_acc[h.history.val_acc.length - 1], status: hpjs.STATUS_OK } ;
};

const hyperTFJS = async () => {
	const dataset = getDataset();
	// defining a search space we want to optimize. Using hpjs parameters here
	const space = {
		kernelRegularizer1: hpjs.choice([undefined, 'l1l2']),
		kernelRegularizer2: hpjs.choice([undefined, 'l1l2']),
		kernelRegularizer3: hpjs.choice([undefined, 'l1l2'])
	};

	// finding the optimal hyperparameters using hpjs.fmin. Here, 6 is the # of times the optimization function will be called (this can be changed)
	const trials = await hpjs.fmin(
		optFunction, space, hpjs.search.randomSearch, 8,
		{ rng: new hpjs.RandomState(654321), dataset }
	);

	const opt = trials.argmin;

	//printing out data
	console.log('trials', trials);
	console.log('best kernelRegularizer1:', opt.kernelRegularizer1);
	console.log('best kernelRegularizer2:', opt.kernelRegularizer2);
	console.log('best kernelRegularizer3:', opt.kernelRegularizer3);
}

hyperTFJS();
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
const optFunction = async (params, { dataset }) => {
	const {
		kernelRegularizer1, kernelRegularizer2, kernelRegularizer3, learningRate,
		filter1, filter2, filter3,
		kernelSize1, kernelSize2, kernelSize3,
		units4, rate4
	} = params;
	const model = createDeepQNetwork(
		MoveAgent.settings.orders.length, MoveAgent.settings.width, MoveAgent.settings.height, MoveAgent.settings.channels.length,
		[
			{kernelRegularizer: kernelRegularizer1, filter: filter1, kernelSize: kernelSize1},
			{kernelRegularizer: kernelRegularizer2, filter: filter2, kernelSize: kernelSize2},
			{kernelRegularizer: kernelRegularizer3, filter: filter3, kernelSize: kernelSize3},
			{units: units4, rate: rate4}
		]
	);
	model.add(tf.layers.softmax());
	const opimizer = optimizers['adam'](learningRate);
	model.compile({
		optimizer: opimizer,
		loss: 'categoricalCrossentropy',
		metrics: ['accuracy'],
	});

	// train model using defined data

	const h = await trainModelUsingFitDataset(model, dataset);
	sendMessage(JSON.stringify(params));
	return { accuracy: h.history.val_acc[h.history.val_acc.length - 1], status: hpjs.STATUS_OK } ;
};

const hyperTFJS = async () => {
	const dataset = getDataset().batch(batchSize);
	// defining a search space we want to optimize. Using hpjs parameters here
	const space = {
		kernelRegularizer1: hpjs.choice([undefined, 'l1l2']),
		kernelRegularizer2: hpjs.choice([undefined, 'l1l2']),
		kernelRegularizer3: hpjs.choice([undefined, 'l1l2']),
		filter1: hpjs.choice([8, 16, 32, 64]),
		filter2: hpjs.choice([8, 16, 32, 64]),
		filter3: hpjs.choice([8, 16, 32, 64]),
		kernelSize1: hpjs.choice([3,4,8,12]),
		kernelSize2: hpjs.choice([3,4,8,12]),
		kernelSize3: hpjs.choice([3,4,8,12]),
		learningRate: hpjs.choice([0.01, 0.001, 0.0001, 0.00001, 0.000001, 0.0000001]),
		units4: hpjs.choice([256,512,768,1024]),
		rate4: hpjs.choice([0.2,0.5,0.7]),
	};

	// finding the optimal hyperparameters using hpjs.fmin. Here, 6 is the # of times the optimization function will be called (this can be changed)
	const trials = await hpjs.fmin(
		optFunction, space, hpjs.search.randomSearch, 999,
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
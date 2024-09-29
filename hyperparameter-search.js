import { getTF } from './static/utils/get-tf.js';
import { getDataset } from './static/utils/get-dataset.js';
import { MoveAgent } from './static/agents/move-agent/move-center-agent.js';
import { createDeepQNetwork } from './dqn/dqn.js';
import { sendMessage, sendDataToTelegram } from './visualization/utils.js';
import { testReward } from './tests/test-reward.js';
import * as hpjs from 'hyperparameters';

const tf = await getTF();


const optFunction = async (params, { dataset, epochs, batchesPerEpoch }) => {
	const { filters1, filters2, filters3 } = params;
	console.log(params)
	const model = createDeepQNetwork(
		MoveAgent.settings.orders.length, MoveAgent.settings.width, MoveAgent.settings.height, MoveAgent.settings.channels.length,
		[
			{ filters: filters1 },
			{ filters: filters2 },
			{ filters: filters3 },
			{}
		]
	);
	model.add(tf.layers.softmax());

	const optimizer = tf.train.adam(0.001);
	model.compile({
		optimizer: optimizer,
		loss: 'categoricalCrossentropy',
		metrics: ['accuracy'],
	});

	const accuracyLogs = [];
	const lossLogs = [];
	const averageVPLogs = []
	let bestAverageVp = 0;


	const fitDatasetArgs = {
		batchSize: 32,
		batchesPerEpoch,
		epochs,
		validationData: dataset,
		validationBatches: 30,
		callbacks: {
			onEpochEnd: async (epoch, { val_acc, val_loss }) => {
				console.log('Get Average reward...');
				const averageVP = await testReward(true, model);
				console.log(`averageVP: ${averageVP}, prevBestVp: ${bestAverageVp}`);

				if (averageVP > bestAverageVp) {
					bestAverageVp = averageVP;
				}

				accuracyLogs.push({ epoch, val_acc });
				averageVPLogs.push({ epoch, averageVP });
				lossLogs.push({ epoch, val_loss });
			}
		}
	};

	const result = await model.fitDataset(dataset, fitDatasetArgs);
	await sendConfigMessage(model);
	await sendMessage(`Best AverageVp: ${bestAverageVp}`)
	await sendDataToTelegram(lossLogs);
	await sendDataToTelegram(accuracyLogs);
	await sendDataToTelegram(averageVPLogs);

	return { loss: result.history.loss[result.history.loss.length - 1], status: hpjs.STATUS_OK } ;
};

async function sendConfigMessage(model) {
	await sendMessage(
		model.layers.map(layer => `${layer.name.split('_')[0]}{${ ['filters', 'kernelSize', 'units', 'rate'].map(filter => layer[filter] ? `${filter}: ${layer[filter]}` : '').filter(v=>v !=='') }}` ).join('->')
	);
}

const hyperTFJS = async (epochs, batchesPerEpoch) => {
	let dataset = getDataset().batch(batchesPerEpoch);
	// defining a search space we want to optimize. Using hpjs parameters here
	const space = {
		filters1: hpjs.choice([16, 12, 8, 6, 4]),
		filters2: hpjs.choice([16, 12, 8, 6, 4]),
		filters3: hpjs.choice([16, 12, 8, 6, 4]),
	};

	// finding the optimal hyperparameters using hpjs.fmin. Here, 6 is the # of times the optimization function will be called (this can be changed)
	const trials = await hpjs.fmin(
		optFunction, space, hpjs.search.randomSearch, 5 * 5 * 5,
		{ dataset, epochs, batchesPerEpoch }
	);

	const opt = trials.argmin;

	//printing out data
	console.log('best kernelSize1:', opt.kernelSize1);
	console.log('best kernelSize2:', opt.kernelSize2);
	console.log('best kernelSize3:', opt.kernelSize3);
}

hyperTFJS(100, 50);
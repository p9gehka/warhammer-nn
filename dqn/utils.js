import process from 'node:process';

export async function getTF() {
	if (process.argv.includes('-gpu')) {
		console.log("USE TFJS-GPU")
		return import ('@tensorflow/tfjs-node-gpu');
	} else {
		return import ('@tensorflow/tfjs-node');
	}
}

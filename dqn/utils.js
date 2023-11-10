import process from 'node:process';

export async function getTF() {
	if (process.argv[2] && process.argv[2] === '-gpu') {
		return import ('@tensorflow/tfjs-node-gpu');
	} else {
		return import ('@tensorflow/tfjs-node');
	}
}

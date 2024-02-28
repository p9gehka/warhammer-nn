export async function getTF() {
	if (typeof window !== 'undefined') {
		return Promise.resolve(window.tf);
	}
	const process = import('node:process');
	if (process.argv?.includes('-gpu')) {
		console.log("USE TFJS-GPU")
		return import ('@tensorflow/tfjs-node-gpu');
	} else {
		return import ('@tensorflow/tfjs-node');
	}
}

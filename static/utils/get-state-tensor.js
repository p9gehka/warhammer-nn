import { getTF } from './get-tf.js';

const tf = await getTF();

export function getStateTensor(state, h, w, channels) {
	const c = channels.length;
	const numExamples = state.length;
	let buffer = tf.buffer([numExamples, h, w, c]);
	for (let n = 0; n < numExamples; ++n) {
		if (state[n] === null) {
			continue;
		}

		channels.forEach((channel, i) => {
			for (let entity in channel) {
				if (state[n][entity] === undefined) {
					return;
				}
				const enitities = state[n][entity].forEach(yx => {
					buffer.set(channel[entity], n, yx[0], yx[1], i);
				});
			}
		});
	}

	return buffer.toTensor();
}

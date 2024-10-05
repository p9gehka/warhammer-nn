import { getTF } from './get-tf.js';

const tf = await getTF();

export function getStateTensor(state, h, w, channels) {
	const c = channels.length;
	const numExamples = state.length;
	/* rotate wh to hwc*/
	const totalRounds = 5;
	const img2Buffer = tf.buffer([numExamples, w, h, c]);
	const roundBuffer = tf.buffer([numExamples, totalRounds]);

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
					/* rotate wh to hwc*/
					img2Buffer.set(channel[entity], n, yx[1], yx[0], i);
				});
			}
		});
		roundBuffer.set(1, n, state[n].round);
	}
	return [img2Buffer.toTensor(), roundBuffer.toTensor()];
}

export function getStateTensor1(state, h, w, channels) {
	const c = channels.length;
	/* rotate wh to hwc*/
	let buffer = tf.buffer([w, h, c]);

	channels.forEach((channel, i) => {
		for (let entity in channel) {
			if (state[entity] === undefined) {
				return;
			}
			const enitities = state[entity].forEach(yx => {
				/* rotate wh to hwc*/
				buffer.set(channel[entity], yx[1], yx[0], i);
			});
		}
	});
	return [buffer.toTensor(), tf.oneHot([state.round], 5)];
}

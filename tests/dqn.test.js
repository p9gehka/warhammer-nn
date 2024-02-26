import tf from '@tensorflow/tfjs-node';
import { getStateTensor } from '../static/utils/get-state-tensor.js';
import { createDeepQNetwork } from '../dqn/dqn.js';
import { Channel1 } from '../environment/player-environment.js';

describe('dqn', () => {
	it('getAction', () => {
		 const height = 44;
		 const width = 30;
		 const channels = [Channel1];
		 const state = {
				Empty: [],
				SelfModel: [],
				SelfModelAvailableToMove: [ [ 10, 6 ], [ 12, 6 ] ],
				SelfModelAvailableToShoot: [],
				Selected: [],
				Marker: [ [ 12, 11 ], [ 22, 9 ], [ 22, 21 ], [ 32, 19 ] ],
				Enemy: [ [ 34, 26 ], [ 32, 26 ] ],
				Ruin: [
					[ 5, 7 ],   [ 6, 7 ],   [ 7, 7 ],   [ 8, 7 ],
					[ 9, 7 ],   [ 10, 7 ],  [ 11, 7 ],  [ 12, 7 ],
					[ 13, 7 ],  [ 14, 7 ],  [ 15, 7 ],  [ 28, 8 ],
					[ 29, 8 ],  [ 30, 8 ],  [ 31, 8 ],  [ 32, 8 ],
					[ 33, 8 ],  [ 34, 8 ],  [ 35, 8 ],  [ 36, 8 ],
					[ 37, 8 ],  [ 38, 8 ],  [ 17, 15 ], [ 18, 15 ],
					[ 19, 15 ], [ 20, 15 ], [ 21, 15 ], [ 22, 15 ],
					[ 23, 15 ], [ 24, 15 ], [ 25, 15 ], [ 26, 15 ],
					[ 27, 15 ], [ 29, 23 ], [ 30, 23 ], [ 31, 23 ],
					[ 32, 23 ], [ 33, 23 ], [ 34, 23 ], [ 35, 23 ],
					[ 36, 23 ], [ 37, 23 ], [ 38, 23 ], [ 39, 23 ],
					[ 6, 22 ],  [ 7, 22 ],  [ 8, 22 ],  [ 9, 22 ],
					[ 10, 22 ], [ 11, 22 ], [ 12, 22 ], [ 13, 22 ],
					[ 14, 22 ], [ 15, 22 ], [ 16, 22 ]
				]
			}
		 const numAction = 33;
		 const network = createDeepQNetwork(numAction, height, width, channels.length);
		 const input = getStateTensor([state], height, width, channels);
		 const order = network.predict(input);

		 expect(order.dataSync().length).toEqual(numAction);
	});
});

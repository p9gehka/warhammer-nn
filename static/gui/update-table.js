import { getStateTensor } from '../utils/get-state-tensor.js';
import { channels } from '../environment/nn-input.js';

export function updateTable(size, input, table) {
	const data = getStateTensor([input], ...size, channels)[0].arraySync();
	const fragment = new DocumentFragment();
	const nextline = Math.floor(Math.sqrt(data[0][0][0].length)) + 1;
	console.log(nextline)
	for(let row of data[0]) {
		const rowEl = document.createElement('TR');
		for (let cell of row) {
			const cellEl = document.createElement('TD');
			cellEl.innerHTML = cell.map((v, i) => v.toFixed(1) + (((i + 1) % nextline === 0) ? '\n' : ',')).join('');
			rowEl.appendChild(cellEl);
			if (cell[0] > 0) {
				cellEl.classList.add('player-model-cell');
			} else if (cell[4] === 1)  {
				cellEl.classList.add('opponent-model-cell');
			} else if (cell[2] !== 0) {
				cellEl.classList.add('object-cell');
			} else if (cell.some(v => v !== 0)) {
				cellEl.classList.add('info-cell');
			}
		}
		fragment.appendChild(rowEl)
	}
	table.innerHTML = '';
	table.appendChild(fragment);
}

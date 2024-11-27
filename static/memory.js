import { moveOrders } from './agents/move-agent/move-orders.js';
import { updateTable } from './gui/update-table.js';
import { getInput, channels } from '../environment/nn-input.js';

const table = document.getElementById('table');
const prev = document.getElementById('prev');
const next = document.getElementById('next');
const nextState = document.getElementById('next-state');
const orderInfoElement = document.getElementById('order');

const state = { from: parseInt(new URLSearchParams(window.location.search).get('from') ?? 0), stateN: 0 }
let lastData = {};

async function update() {
	const { from, stateN } = state;
	const urlPath = `/get?from=${from}&perPage=1`;
	let data = lastData[urlPath];

	if (data === undefined) {
		const response = await fetch(urlPath, {
			method: 'GET',
			headers: { "Content-Type": "application/json" },
		});
		data = await response.json()
		lastData = { [`/get?from=${from}&perPage=1`]: data };
	}

	const [input, order, reward, done, nextInput] = data.buffer[0];
	updateTable([44, 30], [input, nextInput][stateN], table);
	orderInfoElement.innerHTML = JSON.stringify(moveOrders[order]) + ' ' + reward;
}

update();

nextState.addEventListener('click', () => {
	state.stateN = (state.stateN + 1) %2;
	const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?from=${state.from}`;
	window.history.pushState({path:newurl},'',newurl);
	update();
});


next.addEventListener('click', () => {
	state.from++;
	const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?from=${state.from}`;
	window.history.pushState({path:newurl},'',newurl);
	update();
});

prev.addEventListener('click', () => {
	state.from--;
	const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?from=${state.from}`;
	window.history.pushState({path:newurl},'',newurl);
	update();
});

import config from '../config.json' assert { type: 'json' };

export async function lock() {
	try {
		const response = await fetch(`${config.memoryAddress}/lock`, {
			method: 'POST',
			headers: { "Content-Type": "application/json" },
		});
	} catch (e) {
		console.log(e.message);
	}
}

export async function isLocked() {
	try {
		const response = await fetch(`${config.memoryAddress}`, {
			method: 'GET',
			headers: { "Content-Type": "application/json" },
		});
		return response.status === 423;
	} catch (e) {
		console.log(e.message);
	}
}

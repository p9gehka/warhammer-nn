import config from '../config.json' assert { type: 'json' };

export async function lock() {
	const locked = false;

	while(!locked) {
		try {
			await fetch(`${config.memoryAddress}/lock`, {
				method: 'POST',
				headers: { "Content-Type": "application/json" },
			});
			locked = true;
		} catch (e) {
			console.log(e.message);
		}
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

import config from '../config.json' assert { type: 'json' };
export async function getTrainerConfig() {
	console.log(`${config.memoryAddress}/config`)
	try {
		const response = await fetch(`${config.memoryAddress}/config`, {
			method: 'GET',
			headers: { "Content-Type": "application/json" },
		});
		return response.json();
	} catch (e) {
		console.log(e.message);
	}
}

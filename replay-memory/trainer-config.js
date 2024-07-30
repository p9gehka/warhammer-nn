import config from '../config.json' assert { type: 'json' };
export async function getTrainerConfig() {
	console.log(`${config.memoryAddress}/config`)
	while(true) {
		try {
			const response = await fetch(`${config.memoryAddress}/config`, {
				method: 'GET',
				headers: { "Content-Type": "application/json" },
			});

			if (response.status !== 200) {
				console.log('Bad response');
			} else {
				console.log('Update success')
				return response.json();
			}
		} catch (e) {
			console.log(e.message);
		}
	}
}
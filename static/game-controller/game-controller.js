class Game {
	constructor(canvas) {
		canvas.addEventListener('click', (e) => {
			const rect = canvas.getBoundingClientRect()
			const x = Math.round((((event.clientX - rect.left) * 60) / canvas.width) - 0.5);
			const y = Math.round((((event.clientY - rect.top) * 44) / canvas.height) - 0.5);
			console.log("x: " + x + " y: " + y)
		});
	}
}

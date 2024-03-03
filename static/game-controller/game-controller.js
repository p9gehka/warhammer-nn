import { Battlefield, Scene } from '../drawing-entities/drawing-entities.js';
import { Warhammer } from '../environment/warhammer.js'
import { PlayerEnvironment } from '../environment/player-environment.js'
import { ControlledAgent } from '../agents/controlled-agent.js';
import { Orders } from '../environment/orders.js';
import { add, eq, len } from '../utils/vec2.js'

import gameSettings from '../settings/game-settings0.1.json' assert { type: 'json' };

export class Game {
	constructor(canvas) {
		canvas.addEventListener('click', (e) => {
			const rect = canvas.getBoundingClientRect()
			const x = Math.round((((event.clientX - rect.left) * 60) / canvas.width) - 0.5);
			const y = Math.round((((event.clientY - rect.top) * 44) / canvas.height) - 0.5);
			console.log("x: " + x + " y: " + y)
			this.orderHandlers.forEach((orderHandler) => {
				orderHandler([x, y]);
			})
		});

		this.ctx = canvas.getContext("2d");
		this.ctx.scale(canvas.width / 60, canvas.height / 44);

		this.scene = null
		this.env = null
		this.orderResolve;
		this.orderPromise = new Promise((resolve) => { this.orderResolve = resolve });

		this.players = [];
		this.agents = [];

		this.onUpdate = () => {};

		const battlefield = new Battlefield(this.ctx, { size: [0, 0], objective_marker: [], ruins: [] });
		this.orders = new Orders().getOrders().all;
		battlefield.init().then(() => {
			battlefield.draw()
			this.start();
		});
		this.orderHandlers = []
	}


	async start() {
		this.env = new Warhammer({ gameSettings });

		this.scene = new Scene(this.ctx, this.env.getState());
		await this.scene.init();
		this.players = [new PlayerEnvironment(0, this.env), new PlayerEnvironment(1, this.env)];
		this.agents = [new ControlledAgent(this.players[0]), new ControlledAgent(this.players[1])];
		this.play();
	}

	restart() {
		this.agents.forEach(agent => agent.reset());
		this.env.reset();
		this.play();
	}

	async play() {
		while(true) {
			const state = this.env.getState();
			this.scene.updateState(state);
			this.onUpdate(state);

			console.log('CumulativeReward', this.players.map(p => p.cumulativeReward))
			if (state.done) {

				this.agents.forEach(agent => agent.awarding());
				console.log('CumulativeReward awarding', this.players.map(p => p.cumulativeReward));
				break;
			} else {
				const { selected } = this.players[state.player].getState();

				if (state.modelsStamina[selected] > 0) {
					const selectedPosition = state.models[selected];
					this.orderHandlers = this.orders.map((order, i) => {
						return (clickPosition) => {
							if (order.action ==="MOVE" &&
								eq(clickPosition, add(selectedPosition, order.vector)) &&
								state.modelsStamina[selected] >= len(order.vector)
							) {
								this.orderResolve(i);
							}
						}
					});
					this.scene.drawOrders(this.orders.filter(order=> order.action==="MOVE" && state.modelsStamina[selected] >= len(order.vector)).map(order=> add(selectedPosition, order.vector)));
				}

				const order = await this.orderPromise;
				this.orderPromise = new Promise((resolve) => { this.orderResolve = resolve });
				this.agents[state.player].playStep(order)
			}
		}
	}
}

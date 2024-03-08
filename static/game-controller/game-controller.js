import { Battlefield, Scene } from '../drawing-entities/drawing-entities.js';
import { Warhammer } from '../environment/warhammer.js'
import { Deploy, DeployAction, DeployEnvironment, getDeployOrders } from '../environment/deploy.js'
import { PlayerEnvironment } from '../environment/player-environment.js'
import { ControlledAgent } from '../agents/controlled-agent.js';
import { Orders } from '../environment/orders.js';
import { add, eq, len } from '../utils/vec2.js'

import gameSettings from '../settings/game-settings0.1.json' assert { type: 'json' };
import battlefields from '../settings/battlefields-small.json' assert { type: 'json' };

export class Game {
	constructor(canvas) {
		canvas.addEventListener('mousedown', (e) => {
			e.preventDefault();
		})
		canvas.addEventListener('click', (e) => {

			const rect = canvas.getBoundingClientRect()
			const x = Math.round((((event.clientX - rect.left) * 60) / canvas.width) - 0.5);
			const y = Math.round((((event.clientY - rect.top) * 44) / canvas.height) - 0.5);
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

		this.started = false;
		this.orders = new Orders().getOrders().all;
		this.orderHandlers = [];
		this.deployOrders = getDeployOrders();
		const settings = localStorage.getItem('game-settings');
		if (settings) {
			this.deploy(JSON.parse(settings));
		}
	}

	async deploy(gameSettings) {
		this.deploy = new Deploy({ gameSettings, battlefields });
		let state = this.deploy.getState();
		const battlefield = new Battlefield(this.ctx, state.battlefield);
		await battlefield.init()
		battlefield.draw();
		this.scene = new Scene(this.ctx, state);
		this.scene.init();
		this.onUpdate(state);
		const players = [new DeployEnvironment(0, this.deploy), new DeployEnvironment(1, this.deploy)];
		while(true) {
			state = this.deploy.getState();
			if (state.done) {
				break;
			} else {
				this.scene.updateState(state);
				this.onUpdate(state);
				this.orderHandlers = [
					([x, y]) => this.orderResolve([this.deployOrders.setXIndexes[x], this.deployOrders.setYIndexes[y], 1])
				];
				const orders = await this.orderPromise;
				orders.forEach((order) => {
					state = players[state.player].step(this.deployOrders.all[order]);
				});
				if(!state.done) {
					this.orderPromise = new Promise((resolve) => { this.orderResolve = resolve });
				}
			}
		}
	}

	async start() {
		if (this.started) {
			return;
		}
		this.orderResolve([this.deployOrders.doneIndex]);
		this.orderPromise = new Promise((resolve) => { this.orderResolve = resolve });
		this.started = true;

		this.env = new Warhammer({ gameSettings: this.deploy.getSettings(), battlefields });

		this.players = [new PlayerEnvironment(0, this.env), new PlayerEnvironment(1, this.env)];
		this.agents = [new ControlledAgent(this.players[0]), new ControlledAgent(this.players[1])];
		this.play();
	}

	restart() {
		this.players.forEach(player => player.reset());
		this.agents.forEach(agent => agent.reset());
		this.env.reset();
		this.play();
	}

	async play() {
		while(true) {
			const state = this.env.getState();
			this.scene.updateState(state);
			this.onUpdate(state);

			if (state.done) {
				this.agents.forEach(agent => agent.awarding());
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
								this.orderResolve([i]);
							}
						}
					});
					this.scene.drawOrders(this.orders.filter(order=> order.action==="MOVE" && state.modelsStamina[selected] >= len(order.vector)).map(order=> add(selectedPosition, order.vector)));
				}

				const orders = await this.orderPromise;
				this.orderPromise = new Promise((resolve) => { this.orderResolve = resolve });
				orders.forEach(order => {
					this.agents[state.player].playStep(order)
				});
			}
		}
	}
}

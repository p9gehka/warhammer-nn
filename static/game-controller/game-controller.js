import { Battlefield, Scene } from '../drawing-entities/drawing-entities.js';
import { Warhammer, Phase } from '../environment/warhammer.js'
import { Deploy, DeployAction, DeployEnvironment, getDeployOrders } from '../environment/deploy.js'
import { PlayerEnvironment } from '../environment/player-environment.js'
import { ControlledAgent } from '../agents/controlled-agent.js';
import { Orders } from '../environment/orders.js';
import { add, eq, len } from '../utils/vec2.js'

import battlefields from '../settings/battlefields.json' assert { type: 'json' };

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
			this.selectHandler([x, y]);
		});

		this.ctx = canvas.getContext("2d");
		this.ctx.scale(canvas.width / 60, canvas.height / 44);

		this.scene = null
		this.env = null
		this.orderResolve;
		this.orderPromise = new Promise((resolve) => this.orderResolve = resolve);

		this.players = [];
		this.agents = [];

		this.onUpdate = () => {};

		this.started = false;
		this.orders = new Orders().getOrders();
		this.orderHandlers = [];
		this.deployOrders = getDeployOrders();
		this.runDeploy();
	}
	selectHandler(clickPosition) {
		const state = this.started ? this.env.getState() : this.deploy.getState();
		const orders = this.started ? this.orders : this.deployOrders;
		state.players[state.player].models.forEach((modelId, playerModelId) => {
			if(eq(state.models[modelId], clickPosition)) {
				this.orderResolve([orders.selectIndexes[playerModelId]]);
			}
		})
	}
	async runDeploy() {
		const battlefieldName = localStorage.getItem('battlefield-name');
		const battlefieldSettingsLS = battlefields[battlefieldName];
		const gameSettingsLS = localStorage.getItem('game-settings');
		if (!gameSettingsLS || !battlefieldSettingsLS) {
			return;
		}
		const gameSettings = JSON.parse(gameSettingsLS);
		const battlefieldSettings = { [battlefieldName]: battlefieldSettingsLS };

		this.deploy = new Deploy({ gameSettings, battlefields: battlefieldSettings });
		let state = this.deploy.getState();
		const battlefield = new Battlefield(this.ctx, state.battlefield);
		await battlefield.init();
		battlefield.draw();
		this.scene = new Scene(this.ctx, state);
		this.scene.init();
		this.onUpdate(state);
		this.deployPlayers = [new DeployEnvironment(0, this.deploy), new DeployEnvironment(1, this.deploy)];
		while(true) {
			state = this.deploy.getState();
			if (state.done) {
				break;
			} else {
				this.scene.updateState(state);
				this.onUpdate(state);
				this.orderHandlers = [
					([x, y]) => this.orderResolve([this.deployOrders.setXIndexes[x], this.deployOrders.setYIndexes[y], this.deployOrders.deployIndex])
				];
				const orders = await this.orderPromise;
				orders.forEach((order) => {
					state = this.deployPlayers[state.player].step(this.deployOrders.all[order]);
				});
				if(!state.done) {
					this.orderPromise = new Promise((resolve) => this.orderResolve = resolve);
				}
			}
		}
	}

	async start() {
		if (this.started) {
			return;
		}
		this.orderResolve([this.deployOrders.doneIndex]);
		this.orderPromise = new Promise((resolve) => this.orderResolve = resolve);
		this.started = true;

		this.env = new Warhammer({ gameSettings: this.deploy.getSettings(), battlefields: this.deploy.getBattlefields() });

		this.players = [new PlayerEnvironment(0, this.env), new PlayerEnvironment(1, this.env)];
		this.reinforcementsPlayers = [new DeployEnvironment(0, this.env), new DeployEnvironment(1, this.env)];
		this.agents = [new ControlledAgent(this.players[0]), new ControlledAgent(this.players[1])];
		this.play();
	}

	restart() {
		this.orderResolve([this.deployOrders.doneIndex]);
		this.orderPromise = new Promise((resolve) => this.orderResolve = resolve);
		this.players.forEach(player => player.reset());
		this.agents.forEach(agent => agent.reset());
		this.env?.reset();
		this.play();
	}
	reload() {
		this.orderResolve([this.orders.doneIndex]);
		this.orderPromise = new Promise((resolve) => this.orderResolve = resolve);
		this.players.forEach(player => player.reset());
		this.agents.forEach(agent => agent.reset());
		this.env?.reset();
		this.deploy?.reset();
		this.deployPlayers?.forEach(player => player.reset());
		this.reinforcementsPlayers?.forEach(player => player.reset());
		this.started = false;
		this.runDeploy();
	}
	async play() {
		while(true) {
			const state = this.env.getState();
			this.scene.updateState(state);
			this.onUpdate(state);
			this.orderHandlers = [];

			if (state.done) {
				this.agents.forEach(agent => agent.awarding());
				break;
			} else {
				const { selected } = this.players[state.player].getState();

				if (state.modelsStamina[selected] > 0) {
					const selectedPosition = state.models[selected];
					this.orderHandlers = this.orders.all.map((order, i) => {
						return (clickPosition) => {
							if (order.action ==="MOVE" &&
								eq(clickPosition, add(selectedPosition, order.vector)) &&
								state.modelsStamina[selected] >= len(order.vector)
							) {
								this.orderResolve([i]);
							}
						}
					});
					this.scene.drawOrders(this.orders.all.filter(order=> order.action==="MOVE" && state.modelsStamina[selected] >= len(order.vector)).map(order=> add(selectedPosition, order.vector)));
				}

				if (state.phase === Phase.Reinforcements) {
					this.orderHandlers = [
						([x, y]) => this.orderResolve([this.deployOrders.setXIndexes[x], this.deployOrders.setYIndexes[y], this.deployOrders.deployIndex])
					];
				}

				const orders = await this.orderPromise;
				orders.forEach(order => {
					if (state.phase === Phase.Reinforcements) {
						this.reinforcementsPlayers[state.player].step(this.deployOrders.all[order]);
						return;
					}
					this.agents[state.player].playStep(order)
				});

				if(!state.done) {
					this.orderPromise = new Promise((resolve) => this.orderResolve = resolve);
				}
			}
		}
	}
}

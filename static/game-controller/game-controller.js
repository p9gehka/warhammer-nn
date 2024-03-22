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
		canvas.addEventListener('mousedown', (e) => { event.preventDefault(); })
		canvas.addEventListener('click', (event) => {
			const rect = canvas.getBoundingClientRect()
			const x = Math.round((((event.clientX - rect.left) * 60) / canvas.width) - 0.5);
			const y = Math.round((((event.clientY - rect.top) * 44) / canvas.height) - 0.5);
			this.selectHandler([x, y]);
		});

		canvas.addEventListener('contextmenu', (event) => {
			event.preventDefault();
			const rect = canvas.getBoundingClientRect()
			const x = Math.round((((event.clientX - rect.left) * 60) / canvas.width) - 0.5);
			const y = Math.round((((event.clientY - rect.top) * 44) / canvas.height) - 0.5);
			this.orderHandlers?.forEach((orderHandler) => { orderHandler([x, y]) });
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
		this.onUpdateDice = () => {};

		this.started = false;
		this.orders = new Orders().getOrders();
		this.orderHandlers = [];
		this.deployOrders = getDeployOrders();
		this.runDeploy();
		this.selectedUnit = null;
	}
	selectHandler(clickPosition) {
		const state = this.started ? this.env.getState() : this.deploy.getState();
		const orders = this.started ? this.orders : this.deployOrders;

		state.units.forEach((unit, unitId) => {
			unit.models.forEach(modelId => {
				if(eq(state.models[modelId], clickPosition)) {
					this.selectUnit(unitId);
					if (unit.playerId === state.player) {
						const playerModelId = state.players[state.player].models.indexOf(modelId);
						this.orderResolve([orders.selectIndexes[playerModelId]]);
					}
				}
			})
		});
	}
	async runDeploy() {
		const battlefieldName = localStorage.getItem('battlefield-name');
		const battlefieldSettingsLS = battlefields[battlefieldName];
		const settingsLSPlayer1 = localStorage.getItem('game-settings-player1');
		const settingsLSPlayer2 = localStorage.getItem('game-settings-player2');
		if (!settingsLSPlayer1 || !battlefieldSettingsLS || !settingsLSPlayer2) {
			return;
		}

		const player0Settings = JSON.parse(settingsLSPlayer1);
		const player1Settings = JSON.parse(settingsLSPlayer2);
		this.gameSettings = {
			units: [player0Settings.units, player1Settings.units],
			profiles: [...player0Settings.profiles, ...player1Settings.profiles],
			categories: [...player0Settings.categories, ...player1Settings.categories],
			rules: [...player0Settings.rules, ...player1Settings.rules],
			modelNames: [...player0Settings.modelNames, ...player1Settings.modelNames],
			rangedWeapons: [...player0Settings.rangedWeapons, ...player1Settings.rangedWeapons],
			meleeWeapons: [...player0Settings.meleeWeapons, ...player1Settings.meleeWeapons],
		};
		const battlefieldSettings = { [battlefieldName]: battlefieldSettingsLS };

		let envGameSetting = {}
		if (this.gameSettings !== undefined) {
			let modelCounter = 0;
			const resultUnits = [[], []];
			this.gameSettings.units.forEach((units, i) => {
				units.forEach(unit => {
					resultUnits[i].push({...unit, models: unit.models.map((id) => modelCounter++) });
				});
			});

			envGameSetting = {
				...this.gameSettings,
				units: resultUnits,
			}
		}

		this.deploy = new Deploy({ gameSettings: envGameSetting, battlefields: battlefieldSettings });
		let state = this.deploy.getState();
		const battlefield = new Battlefield(this.ctx, state.battlefield);
		await battlefield.init();
		battlefield.draw();
		this.scene = new Scene(this.ctx, state);
		this.scene.init();
		this.deployPlayers = [new DeployEnvironment(0, this.deploy), new DeployEnvironment(1, this.deploy)];
		this.onUpdate(state, this.deployPlayers[state.player].getState());
		while(true) {
			state = this.deploy.getState();
			if (state.done) {
				break;
			} else {
				this.scene.updateState(state);
				this.onUpdate(state, this.deployPlayers[state.player].getState());
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
			this.onUpdate(state, (state.phase === Phase.Reinforcements ? this.reinforcementsPlayers : this.players)[state.player].getState());
			this.orderHandlers = [];

			if (state.done) {
				this.agents.forEach(agent => agent.awarding());
				break;
			} else {
				const { selected } = this.players[state.player].getState();
				const opponentId = (state.player + 1) % 2
				if ((state.phase === Phase.Movement || state.phase === Phase.PreBattle) && state.modelsStamina[selected] > 0) {
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

				if (state.phase === Phase.Shooting && selected !== null) {
					this.orderHandlers = []
					 state.players[opponentId].units.forEach((unit, opponentUnitId) => {
						unit.models.map((modelId) => {
							this.orderHandlers.push((clickPosition) => {
								if(eq(state.models[modelId], clickPosition)) {
									this.orderResolve([this.orders.setTargetIndex[opponentUnitId]])
								}
							})
						});
					})
				}

				const orders = await this.orderPromise;
				orders.forEach(order => {
					if (state.phase === Phase.Reinforcements) {
						this.reinforcementsPlayers[state.player].step(this.deployOrders.all[order]);
						return;
					}
					const [lastAction] = this.agents[state.player].playStep(order)
					if (lastAction.misc && Object.keys(lastAction.misc).length > 0) {
						this.onUpdateDice(lastAction.misc);
					}
				});

				if(!state.done) {
					this.orderPromise = new Promise((resolve) => this.orderResolve = resolve);
				}
			}
		}
	}
	selectUnit(unitId) {
		this.selectedUnit = unitId;
	}

	selectNextModel() {
		const state = this.started ? this.env.getState() : this.deploy.getState();
		const orders = this.started ? this.orders : this.deployOrders;
		const totalLength = state.players[state.player].models.length;
		const selectedModel = state.players[state.player].models.indexOf(this.getSelectedModel());
		this.orderResolve([orders.selectIndexes[(selectedModel + 1) % totalLength]]);
	}
	getSelectedModel() {
		const state = this.started ? this.env.getState() : this.deploy.getState();
		const player = state.player;
		if (!this.started) {
			return this.deployPlayers[player].getState().selected;
		}
		if (state.phase === Phase.Reinforcements) {
			return this.reinforcementsPlayers[state.player].getState().selected;
		}
		return this.players[state.player].getState().selected;
	}
}

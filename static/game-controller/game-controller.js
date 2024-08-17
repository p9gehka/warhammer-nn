import { Battlefield, Scene } from '../drawing-entities/drawing-entities.js';
import { Warhammer, Phase } from '../environment/warhammer.js'
import { Deploy, DeployEnvironment } from '../environment/deploy.js'
import { add, eq, len } from '../utils/vec2.js'
import { PlayerControlled } from '../players/player-controlled.js';
import { PlayerAgent } from '../players/player-agent.js'
import { getDeployModelOrders, getSetTargetOrder, doneOrder, getSelectModelOrder, getMoveOrders } from '../players/player-orders.js';

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
			const rect = canvas.getBoundingClientRect();
			const x = Math.round((((event.clientX - rect.left) * 60) / canvas.width) - 0.5);
			const y = Math.round((((event.clientY - rect.top) * 44) / canvas.height) - 0.5);
			this.orderHandlers?.forEach((orderHandler) => { orderHandler([x, y]) });
		});

		this.ctx = canvas.getContext("2d");
		this.ctx.scale(canvas.width / 60, canvas.height / 44);

		this.scene = null;
		this.env = null;
		this.orderResolve;
		this.orderPromise = new Promise((resolve) => this.orderResolve = resolve);

		this.agents = [];

		this.onUpdate = () => {};
		this.onUpdateDice = () => {};

		this.started = false;
		this.orderHandlers = [];
		this.runDeploy();
		this.selectedUnit = null;
	}
	selectHandler(clickPosition) {
		const state = this.started ? this.env.getState() : this.deploy.getState();

		state.units.forEach((unit, unitId) => {
			unit.models.forEach(modelId => {
				if(eq(state.models[modelId], clickPosition)) {
					this.selectUnit(unitId);
					if (unit.playerId === state.player) {
						const playerModelId = state.players[state.player].models.indexOf(modelId);
						this.orderResolve([getSelectModelOrder(playerModelId)]);
					} else {
						this.onUpdate(state);
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
			unitProfiles: [...player0Settings.unitProfiles, ...player1Settings.unitProfiles],
			modelProfiles: [...player0Settings.modelProfiles, ...player1Settings.modelProfiles],
			categories: [...player0Settings.categories, ...player1Settings.categories],
			rules: [...player0Settings.rules, ...player1Settings.rules],
			modelNames: [...player0Settings.modelNames, ...player1Settings.modelNames],
			rangedWeapons: [...player0Settings.rangedWeapons, ...player1Settings.rangedWeapons],
			meleeWeapons: [...player0Settings.meleeWeapons, ...player1Settings.meleeWeapons],
		};
		const battlefieldSettings = { [battlefieldName]: battlefieldSettingsLS };

		let envGameSetting = {};
		if (this.gameSettings !== undefined) {
			let modelCounter = 0;
			const resultUnits = [[], []];
			this.gameSettings.units.forEach((units, i) => {
				units.forEach(unit => {
					resultUnits[i].push({ ...unit, models: unit.models.map((id) => modelCounter++) });
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
		this.scene = new Scene(this.ctx, state, this.gameSettings);
		this.scene.init();
		this.deployPlayers = [new DeployEnvironment(0, this.deploy), new DeployEnvironment(1, this.deploy)];
		this.onUpdate(state);
		while(true) {
			state = this.deploy.getState();
			if (state.done) {
				break;
			} else {
				this.scene.updateState(state, {}, { selecteddUnit: this.selectedUnit });
				this.onUpdate(state);
				this.orderHandlers = [(coord) => this.orderResolve(getDeployModelOrders(coord))];
				const orders = await this.orderPromise;
				orders.forEach((order) => {
					state = this.deployPlayers[state.player].step(order);
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
		this.orderResolve([doneOrder]);
		this.orderPromise = new Promise((resolve) => this.orderResolve = resolve);
		this.started = true;

		this.env = new Warhammer({ gameSettings: this.deploy.getSettings(), battlefields: this.deploy.getBattlefields() });

		this.reinforcementsPlayers = [new DeployEnvironment(0, this.env), new DeployEnvironment(1, this.env)];
		this.agents = [new PlayerControlled(0, this.env), new PlayerAgent(1, this.env)];
		await this.agents[1].load()
		this.play();
	}

	restart() {
		this.orderResolve([doneOrder]);
		this.orderPromise = new Promise((resolve) => this.orderResolve = resolve);
		this.agents.forEach(agent => agent.reset());
		this.env?.reset();
		this.play();
	}
	reload() {
		this.orderResolve([doneOrder]);
		this.orderPromise = new Promise((resolve) => this.orderResolve = resolve);
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
			const playerState = this.agents[state.player].getState();
			this.scene.updateState(state, playerState, { selecteddUnit: this.selectedUnit });
			this.onUpdate(state);
			this.orderHandlers = [];

			if (state.done) {
				break;
			} else {
				const { selected } = playerState;
				const opponentId = (state.player + 1) % 2;
				if ((state.phase === Phase.Movement || state.phase === Phase.PreBattle) && state.modelsStamina[selected] > 0) {
					const selectedPosition = state.models[selected];
					this.orderHandlers = getMoveOrders().map((order) => {
						return (clickPosition) => {
							if (eq(clickPosition, add(selectedPosition, order.vector)) &&
								state.modelsStamina[selected] >= len(order.vector)
							) {
								this.orderResolve([order]);
							}
						}
					});
					this.scene.drawOrders(getMoveOrders().filter(order=> state.modelsStamina[selected] >= len(order.vector)).map(order=> add(selectedPosition, order.vector)));
				}

				if (state.phase === Phase.Reinforcements) {
					this.orderHandlers = [(coord) => this.orderResolve(getDeployModelOrders(coord))];
				}

				if (state.phase === Phase.Shooting && selected !== null) {
					this.orderHandlers = [];
					state.players[opponentId].units.forEach((unit, opponentUnitId) => {
						unit.models.map((modelId) => {
							this.orderHandlers.push((clickPosition) => {
								if(eq(state.models[modelId], clickPosition)) {
									this.orderResolve([getSetTargetOrder(opponentUnitId)]);
								}
							});
						});
					})
				}

				

				if (state.phase === Phase.Reinforcements) {
					const orders = await this.orderPromise;
					orders.forEach(order => {
						this.reinforcementsPlayers[state.player].step(order);
					});
				} else {
					this.agents[state.player].orderPromise = this.orderPromise;
					const [lastAction] = await this.agents[state.player].playStep();
					if (state.player === 1) {
						this.scene.drawOrder(lastAction);
						await new Promise(resolve => setTimeout(resolve, 50));
					}
					if (lastAction.misc && Object.keys(lastAction.misc).length > 0) {
						this.onUpdateDice(lastAction.misc);
					}
				}

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
		const totalLength = state.players[state.player].models.length;
		const selectedModel = state.players[state.player].models.indexOf(this.getSelectedModel());
		this.orderResolve([getSelectModelOrder((selectedModel + 1) % totalLength)]);
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
		return this.agents[player].getState().selected;
	}
}

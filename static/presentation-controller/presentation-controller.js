import { Battlefield, Scene } from '../drawing-entities/drawing-entities.js';
import { Warhammer, Phase } from '../environment/warhammer.js'
import { add, eq, len } from '../utils/vec2.js'
import { PlayerControlled } from '../players/player-controlled.js';
import { PlayerAgent } from '../players/player-agent.js'
import { getSetTargetOrder, doneOrder, getSelectModelOrder, getMoveOrders } from '../players/player-orders.js';

import battlefields from './battlefields.json' assert { type: 'json' };
import player0Settings from './game-settings-p0-full.json' assert { type: 'json' };
import player1Settings  from './game-settings-p1-full.json' assert { type: 'json' };

export class Game {
	constructor(canvas) {
		this.ctx = canvas.getContext("2d");
		this.ctx.scale(canvas.width / 60, canvas.height / 44);

		this.scene = null;
		this.env = null;
		this.orderResolve;

		this.agents = [];

		this.onUpdate = () => {};
		this.onUpdateDiceHistory = () => {};

		this.started = false;
		this.orderHandlers = [];
		this.runDeploy();
		this.selectedUnit = null;
	}

	async runDeploy() {

		this.gameSettings = {
			units: [player0Settings.units, player1Settings.units],
			modelProfiles: [...player0Settings.modelProfiles, ...player1Settings.modelProfiles],
			categories: [...player0Settings.categories, ...player1Settings.categories],
			rules: [...player0Settings.rules, ...player1Settings.rules],
			abilities: [...player0Settings.abilities, ...player1Settings.abilities],
			modelNames: [...player0Settings.modelNames, ...player1Settings.modelNames],
			rangedWeapons: [...player0Settings.rangedWeapons, ...player1Settings.rangedWeapons],
			meleeWeapons: [...player0Settings.meleeWeapons, ...player1Settings.meleeWeapons],
			armyRule:[player0Settings.armyRule, player1Settings.armyRule],
			detachment: [player0Settings.detachment, player1Settings.detachment],
		};

		this.envGameSetting = {};
		if (this.gameSettings !== undefined) {
			let modelCounter = 0;
			const resultUnits = [[], []];
			this.gameSettings.units.forEach((units, i) => {
				units.forEach(unit => {
					resultUnits[i].push({ ...unit, models: unit.models.map((id) => modelCounter++) });
				});
			});

			this.envGameSetting = {
				...this.gameSettings,
				units: resultUnits,
				models: new Array(modelCounter).fill(undefined),
			}
		}

		const battlefield = new Battlefield(this.ctx, { size: [0, 0], objective_marker: [], ruins: [] });
		await battlefield.init();
		battlefield.draw();
	}

	async start() {
		if (this.started) {
			return;
		}
		this.started = true;

		this.env = new Warhammer({ gameSettings: this.envGameSetting, battlefields });

		this.scene = new Scene(this.ctx, this.env.getState(), this.gameSettings);
		this.scene.init();
		
		this.agents = [new PlayerAgent(0, this.env), new PlayerAgent(1, this.env)];
		await this.agents[1].load();
		await this.agents[0].load();
		this.play();
	}

	restart() {
		this.agents.forEach(agent => agent.reset());
		this.env?.reset();
	}
	async play() {
		while(true) {
			const state = this.env.getState();
			const playerState = this.agents[state.player].getState();
			this.scene.updateState(state, playerState, { selecteddUnit: this.selectedUnit });
			this.onUpdate(state);
			this.orderHandlers = [];

			if (state.done) {
				this.restart()
			} else {
				const [lastAction] = await this.agents[state.player].playStep();

				this.scene.drawOrder(lastAction);

				await new Promise(resolve => setTimeout(resolve, 100));
				if (lastAction.action === 'NEXT_PHASE') {
					await new Promise(resolve => setTimeout(resolve, 1000));
				}
				if (lastAction?.misc?.diceHistory) {
					this.onUpdateDiceHistory(lastAction.misc.diceHistory);
				}
			}
		}
	}
	getSelectedModel() {
		return this.getCurrentPlayer().getState().selected;
	}
	getCurrentPlayer() {
		const state = this.env.getState() 
		const player = state.player;
		return this.agents[player];
	}
}

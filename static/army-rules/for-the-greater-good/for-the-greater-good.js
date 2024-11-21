import { BaseAction } from '../../environment/warhammer.js';
import { PlayerAction } from '../../players/player-orders.js';

export class ForTheGreaterGood {
	name = 'For The Greater Good';
	observers = {};
	constructor(player, detachment) {
		this.player = player;
		this.detachment = detachment[0];
	}

	waitObserverSelect() {
		const targeting = this.player._shootingTargeting[this.player._shootingQueue[0]];
		const { selected } = this.player.getState();

		if (selected === undefined || targeting === undefined || Object.keys(targeting).length === 0) {
			return;
		}
		const state = this.player.env.getState();
		const observerUnit = state.players[this.player.playerId].units.find(unit => unit.models.includes(selected));
		if(this.observers[observerUnit?.id] !== undefined) {
			return;
		}

		const guidedUnit = state.players[this.player.playerId].units.find(unit => unit.models.includes(Number(Object.keys(targeting)[0])));
		this.observers[observerUnit.gameId] = guidedUnit.gameId;
	}

	orderModifiers({ action, id }) {
		if (action !== PlayerAction.Shoot || id === undefined) {
			return {};
		}
		const state = this.player.env.getState();
		const shooterUnit = state.players[this.player.playerId].units.find(unit => unit.models.includes(Number(id)));
		let bs = 0;
		let keywords = []
		if (Object.values(this.observers).includes(shooterUnit.gameId)) {
			bs = -1;

			const rules = []
			if (this.detachment === 'kauyon' && state.round >= 2) {
				keywords = ['Susteined Hits 2'];
			}
			if (this.detachment === "mont'ka" && state.round <= 2) {
				keywords = ['Lethal Hits'];
			}

		} else {
			if (this.detachment === 'kauyon' && state.round >= 2) {
				keywords = ['Susteined Hits 1'];
			}
		}
		return { bs, keywords };
	}

	afterStep(order) {
		if (order.action === BaseAction.NextPhase) {
			this.observers = {};
		}
	}
}

import { PlayerAction } from '../../players/player-orders.js';
import { BaseAction } from '../../environment/warhammer.js';

export class ForTheGreaterGood {
	name = 'For The Greater Good';
	_waitObserverSelect = false;
	observers = [];
	constructor() {}

	waitOrder(action) {
		return this._waitObserverSelect && action === PlayerAction.Select;
	}

	playStep(order) {
		this.observers.push(order.id);
		this._waitObserverSelect = false;
		return { action: BaseAction.Empty };
	}
	waitObserverSelect() {
		this._waitObserverSelect = true;
	}
}

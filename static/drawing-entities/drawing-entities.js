import base from '../settings/base.json' assert { type: 'json' };
import { Orders } from '../environment/orders.js';
import { Drawing } from './drawing.js';
import { deployment } from '../battlefield/deployment.js';
import { terrain } from '../battlefield/terrain.js';

const mmToInch = mm => mm / 25.4;

class Binding extends Drawing {
	constructor(ctx, fromArg, to) {
		super();
		this.ctx = ctx;
		this.from = [fromArg[0] + Math.random(), fromArg[1] + Math.random()];
		this.to = to;
	}

	draw() {
		this.ctx.strokeStyle = 'pink';
		this.strokePath(() => {
			this.ctx.moveTo(...this.from);
			this.ctx.lineTo(...this.to);
		});
	}
}
class Model extends Drawing {
	position = [0, 0];
	constructor(ctx, unit, position) {
		super();
		this.ctx = ctx
		this.name = unit.name;
		this.playerId = unit.playerId;
		this.position = position;
		this.unitBase = base[unit.name] ?? [15];
		this.selected = false;
	}

	draw() {
		if (isNaN(this.position[0])) {
			return;
		}
		const base = this.unitBase;
		const radius = 1
		this.ctx.fillStyle = this.playerId === 1 ? '#3e476b' : '#6b3e3e';
		this.ctx.strokeStyle = this.playerId === 1 ? 'blue' : 'red';
		this.ctx.translate(0.5, 0.5);
		this.fillPath(() => {
			this.ctx.ellipse(this.position[0], this.position[1], mmToInch(base[0] / 2), mmToInch(base[0] / 2), 0, 0, 2 * Math.PI);
		});

		this.strokePath(() => {
			this.ctx.ellipse(this.position[0], this.position[1], mmToInch(base[0] / 2), mmToInch(base[0] / 2), 0, 0, 2 * Math.PI);
		});
		this.ctx.strokeStyle = 'yellow'; //'greenyellow'
		if (this.selected) {
			this.strokePath(() => {
				this.ctx.ellipse(this.position[0], this.position[1], mmToInch((base[0] / 2) + 8), mmToInch((base[0] / 2) + 8), 0, 0, 2 * Math.PI);
			});
		}
		this.ctx.translate(-0.5, -0.5);

	}
	update(position, selected) {
		this.selected = selected;
		this.position = position;
	}
}

const sceneSize = [60, 44];
export class Battlefield extends Drawing {
	constructor(ctx, battlefield) {
		super();
		this.ctx = ctx;
		this.battlefield = battlefield;
	}
	async init() {
		return new Promise((resolve) => {
			this.bg = new Image(...sceneSize);
			this.bg.addEventListener('load', resolve);
			this.bg.src = "image/map.jpg";
		});
	}

	update(battlefield) {
		this.battlefield = battlefield;
	}

	draw() {
		this.ctx.drawImage(this.bg, 0, 0, ...sceneSize);

		/*border*/
		this.ctx.lineWidth = 0.1;
		this.ctx.strokeStyle = "red";
		this.strokePath(() => {
			this.ctx.rect(0, 0, ...this.battlefield.size);
		});

		/*deployment*/
		this.ctx.lineWidth = 0.1;

		if (this.battlefield.deployment) {
			(new deployment[this.battlefield.deployment]).getDrawings().forEach(({ methods, args, strokeStyle }) => {
				this.ctx.strokeStyle = strokeStyle;
				this.strokePath(() => { 
					 methods.forEach((method, i) => {
					 	this.ctx[method](...args[i]);
					 });
				});
			});
		}


		/*runis*/

		if (this.battlefield.terrain) {
			(new terrain[this.battlefield.terrain]).getDrawings().forEach(({ methods, args, fillStyle }) => {
				this.ctx.fillStyle = fillStyle;
				this.fillPath(() => { 
					 methods.forEach((method, i) => {
					 	this.ctx[method](...args[i]);
					 });
				});
			});
		}


		/*dots*/
		this.ctx.translate(0.5, 0.5);
		this.ctx.fillStyle = '#b4dfb4';
		this.fillPath(() => {
			for (let i = 0; i < sceneSize[0]; i++) {
				for (let ii = 0; ii < sceneSize[1]; ii++) {
					this.ctx.rect(i - 0.05, ii - 0.05, 0.1, 0.1);
				}
			}
		});

		this.ctx.translate(-0.5, -0.5);
	}
}

export class Scene extends Drawing {
	players = [];
	units = [];
	models = [];
	bindings = [];
	constructor(ctx, state) {
		super();
		this.ctx = ctx;
		this.players = state.players;
		this.units = state.units;
		this.battlefield = new Battlefield(ctx, state.battlefield);
		this.models = state.units.map(unit => {
			return unit.models.map(id => new Model(ctx, unit, state.models[id]));
		}).flat();
	}

	async init() {
		await this.battlefield.init()
		this.draw()
	}

	draw() {
		this.battlefield.draw();
		this.models.forEach(model => model.draw());
		this.bindings.forEach(binding => binding.draw());
	}

	drawOrder(order) {
		if (order === null) {
			return;
		}
		if (order.action === "SHOOT") {
			if (!this.models[order.id].position || !order?.misc?.targetPosition) {
				return;
			}
			this.ctx.strokeStyle = "orange";
			this.strokePath(() => {
				this.ctx.moveTo(...this.models[order.id].position);
				this.ctx.lineTo(...order.misc.targetPosition);
			});
		}
	}
	drawOrders(orders) {
		this.ctx.translate(0.5, 0.5);
		this.fillPath(() => {
			this.ctx.fillStyle = '#00000050';
			orders.forEach(([x1, y1]) => {
				this.ctx.rect(x1 - 0.5, y1 - 0.5, 1, 1);
			});
		});
		this.ctx.translate(-0.5, -0.5);
	}
	updateState(state, playerState = {}, gameControllerState = {}) {
		this.battlefield.update(state.battlefield);
		state.players.forEach((player, playerId) => {
			player.models.forEach((id, index) => {
				this.models[id].update(state.models[id], state.player === playerId && playerState.selected === index);
			});
		});
		this.bindings = [];
		if (playerState?.shootingTargeting !== undefined) {
			for (let weaponName in playerState.shootingTargeting) {
				for (let shooterId in playerState.shootingTargeting[weaponName]) {
					for (let targetId of playerState.shootingTargeting[weaponName][shooterId]) {
						this.bindings.push(
							new Binding(
								this.ctx,
								state.models[shooterId],
								state.models[state.units[targetId].models[0]]
							)
						);
					}
				}
			}
		}
		this.draw();
	}
}
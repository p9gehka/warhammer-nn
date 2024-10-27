import { Drawing } from './drawing.js';
import { deployment } from '../battlefield/deployment.js';
import { terrain } from '../battlefield/terrain.js';

const mmToInch = mm => mm / 25.4;

class Binding extends Drawing {
	constructor(ctx, from, to, color) {
		super();
		this.ctx = ctx;
		this.from = from;
		this.to = to;
		this.color = color;
	}

	draw() {
		this.ctx.strokeStyle = this.color;
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
		this.unitBase = [28];
	}

	draw() {
		if (this.position[0] === null) {
			return;
		}
		const base = this.unitBase;
		const radius = 1
		this.ctx.fillStyle = this.playerId === 1 ? '#3e476b' : '#6b3e3ec2';
		this.ctx.strokeStyle = this.playerId === 1 ? 'blue' : 'red';
		this.fillPath(() => {
			this.ctx.ellipse(this.position[0], this.position[1], mmToInch(base[0] / 2), mmToInch(base[0] / 2), 0, 0, 2 * Math.PI);
		});
		this.strokePath(() => {
			this.ctx.ellipse(this.position[0], this.position[1], mmToInch(base[0] / 2), mmToInch(base[0] / 2), 0, 0, 2 * Math.PI);
		});

	}
	update(position) {
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
		this.ctx.fillStyle = '#b4dfb4';
		this.fillPath(() => {
			for (let i = 0; i < sceneSize[0]; i++) {
				for (let ii = 0; ii < sceneSize[1]; ii++) {
					this.ctx.rect(i - 0.05, ii - 0.05, 0.1, 0.1);
				}
			}
		});
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
		this.player = state.player;

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
			const targetUnitModels = this.units[order.target]?.models?.filter(modelId => this.models[modelId].position[0] !== null) ?? [];
			const targetPosition = this.models[targetUnitModels[0]]?.position;
			if (!this.models[order.id].position || targetPosition === undefined) {
				return;
			}
			this.bindings.push(new Binding(this.ctx, this.models[order.id].position, targetPosition, 'orange'));
		}
	}

	updateState(state, playerState = {}, order) {
		this.battlefield.update(state.battlefield);
		this.players = state.players;
		this.units = state.units;
		this.bindings = [];

		if (order) {
			this.drawOrder(order);
		}

		if (playerState.arrows !== undefined) {
			playerState.arrows.forEach(([start, end]) => {
				this.bindings.push(new Binding(this.ctx, start, end, 'yellow'));
			});
		}

		state.models.forEach((position, id) => {
			this.models[id].update(position);
		});

		
		this.draw();
	}
}
import tauUnits from '../settings/tau-units.json' assert { type: 'json' };
import { Orders } from '../environment/orders.js';

const mmToInch = mm => mm / 25.4;

class Drawing {
	fillPath(cb) {
		this.ctx.beginPath()
		cb();
		this.ctx.closePath()
		this.ctx.fill();
	}

	strokePath(cb) {
		this.ctx.beginPath()
		cb();
		this.ctx.closePath()
		this.ctx.stroke();
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
		this.unitProfile = tauUnits[unit.name];
	}

	draw() {
		if (this.position === null) {
			return;
		}
		const { base } = this.unitProfile;
		const radius = 1
		this.ctx.fillStyle = this.playerId === 1 ? 'blue' : 'red';
		this.ctx.translate(0.5, 0.5);
		this.fillPath(() => {
			this.ctx.ellipse(this.position[0], this.position[1], mmToInch(base[0] / 2), mmToInch(base[0] / 2), 0, 0, 2 * Math.PI);
		});
		this.ctx.translate(-0.5, -0.5);

	}
	update(position) {
		this.position = position;
	}
}

const sceneSize = [44, 30];
export class Battlefield extends Drawing {
	constructor(ctx, battlefield) {
		super();
		this.ctx = ctx;
		this.battlefield = battlefield;
	}
	async init() {
		return new Promise((resolve) => {
			this.bg = new Image(...sceneSize);
			this.bg.addEventListener('load', resolve)
			this.bg.src = "image/map.jpg";
		});
	}

	update(battlefield) {
		this.battlefield = battlefield;
	}

	draw() {
		this.ctx.drawImage(this.bg, 0, 0, ...sceneSize);
		this.ctx.lineWidth = 0.1;
		this.ctx.strokeStyle = "red";
		this.strokePath(() => {
			this.ctx.rect(0, 0, ...this.battlefield.size);
		});

		this.ctx.translate(0.5, 0.5);
		this.ctx.fillStyle = '#b4dfb4';
		this.fillPath(() => {
			for (let i = 0; i < sceneSize[0]; i++) {
				for (let ii = 0; ii < sceneSize[1]; ii++) {
					this.ctx.rect(i - 0.05, ii - 0.05, 0.1, 0.1);
				}
			}
		});

		this.ctx.strokeStyle = "burlywood";
		this.battlefield.objective_marker.forEach((pos) => {
			this.strokePath(() => {
				this.ctx.ellipse(
					...pos,
					this.battlefield.objective_marker_control_distance,
					this.battlefield.objective_marker_control_distance,
					0, 0, 2 * Math.PI
				);
			});
		});

		this.ctx.strokeStyle = "black";
		this.battlefield.ruins.forEach((ruin) => {
			const [x1, y1] = ruin.at(0);
			const [x2, y2] = ruin.at(-1);
			this.strokePath(() => {
				this.ctx.rect(x1, y1, Math.max(Math.abs(x1 - x2), 0.5), Math.max(Math.abs(y1 - y2), 0.5));
			});
		});
		this.ctx.translate(-0.5, -0.5);
	}
}

export class Scene extends Drawing {
	players = []
	units = []
	models = []
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

	updateState(state) {
		state.models.forEach((position, id) => {
			this.models[id].update(position);
		});

		this.draw();
	}
}
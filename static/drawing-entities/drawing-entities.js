import tauUnits from '../settings/tau-units.json' assert { type: 'json' };

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
		this.ctx.fillStyle = this.playerId == 1 ? 'blue' : 'red';

		this.fillPath(() => {
			this.ctx.ellipse(this.position[0], this.position[1], mmToInch(base[0] / 2), mmToInch(base[0] / 2), 0, 0, 2 * Math.PI);
		});
	}
	update(position) {
		this.position = position;
	}
}

export class Battlefield extends Drawing {
	constructor(ctx, battlefield) {
		super();
		this.ctx = ctx;
		this.battlefield = battlefield;
	}
	update(battlefield) {
		this.battlefield = battlefield;
	}

	draw() {
		this.ctx.fillStyle = "green";
		this.fillPath(() => {
			this.ctx.rect(0, 0, ...this.battlefield.size);
		})

		this.ctx.lineWidth = 0.1;
		this.ctx.strokeStyle = "burlywood";
		this.battlefield.objective_marker.forEach((pos) => {
			this.strokePath(() => {
				this.ctx.ellipse(
					...pos,
					this.battlefield.objective_marker_control_distance,
					this.battlefield.objective_marker_control_distance,
					0, 0, 2 * Math.PI
				);
			})
		});

		this.ctx.strokeStyle = "black";
		this.battlefield.ruins.forEach(([[x1, y1], [x2, y2]]) => {
			this.strokePath(() => {
				this.ctx.rect(x1, y1, Math.max(Math.abs(x1 - x2), 1), Math.max(Math.abs(y1 - y2), 1));
			})
		})
	}
}

export class Scene extends Drawing {
	players = []
	units = []
	models = []
	constructor(ctx, state) {
		super();
		this.ctx = ctx;
		this.players = state.players
		this.units = state.units
		this.battlefield = new Battlefield(ctx, state.battlefield);
		this.models = state.units.map(unit => {
			return unit.models.map(id => new Model(ctx, unit, state.models[id]));
		}).flat();
		this.draw();
	}
	draw() {
		this.battlefield.draw();
		this.models.forEach(model => model.draw())
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
				this.ctx.lineTo(...order.misc.targetPosition)
			});
		}
	}
	updateState(state) {

		state.models.forEach((position, id) => {
			this.models[id].update(position);
		})

		this.draw();
	}
}
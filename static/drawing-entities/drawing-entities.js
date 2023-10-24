import gameSettings from '../settings/game-settings.json' assert { type: 'json' };
import tauUnits from '../settings/tau-units.json' assert { type: 'json' };

import { toRadians } from '../utils/vec2.js';

const mmToInch = mm => mm / 25.4;

const { battlefield } = gameSettings;
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
		this.palayerId = unit.playerId;
		this.position = position;
		this.unitProfile = tauUnits[unit.name];
	}

	draw() {
		const { base } = this.unitProfile;
		const radius = 1
		this.ctx.fillStyle = this.palayerId == 1 ? 'blue' : 'red';

		this.fillPath(() => {
			this.ctx.ellipse(this.position[0], this.position[1], mmToInch(base[0] / 2), mmToInch((base[1] ?? base[0]) / 2), toRadians(this.position[2] ?? 0), 0, 2 * Math.PI);
		})
	}
	update(position) {
		this.position = position;
	}
}

export class Battlefield extends Drawing {
	constructor(ctx) {
		super();
		this.ctx = ctx;
	}
	draw() {
		this.ctx.fillStyle = "green";
		this.fillPath(() => {
			this.ctx.rect(0, 0, ...battlefield.size);
		})


		const objectiveMarkerSize = battlefield.objective_marker_size;
		this.ctx.fillStyle = "brown";
		battlefield.objective_marker.forEach((pos) => {
			this.fillPath(() => {
				this.ctx.ellipse(...pos, mmToInch(objectiveMarkerSize[0]) / 2, mmToInch(objectiveMarkerSize[0]) / 2, 0, 0, 2 * Math.PI)
			})
		})

		this.ctx.lineWidth = 0.1;
		this.ctx.strokeStyle = "burlywood";
		battlefield.objective_marker.forEach((pos) => {
			this.strokePath(() => {
				this.ctx.ellipse(
					...pos,
					mmToInch(objectiveMarkerSize[0]) / 2 + battlefield.objective_marker_control_distance,
					mmToInch(objectiveMarkerSize[0]) / 2 + battlefield.objective_marker_control_distance,
					0, 0, 2 * Math.PI
				);
			})
		})


		this.ctx.fillStyle = "gray";
		battlefield.ruins.forEach((pos) => {
			this.fillPath(() => {
				this.ctx.rect(...pos, ...battlefield.ruins_size);
			})
		})
	}
}

export class Scene {
	players = []
	units = []
	models = []
	constructor(ctx, state) {
		this.ctx = ctx;
		this.players = state.players
		this.units = state.units
		this.battlefield = new Battlefield(ctx);
		this.models = state.units.map(unit => {
			return unit.models.map(id => new Model(ctx, unit, state.models[id]));
		}).flat();
		this.draw();
	}
	draw() {
		this.battlefield.draw();
		this.models.forEach(model => model.draw())
	}
	updateState(state) {

		state.models.forEach((position, id) => {
			this.models[id].update(position);
		})

		this.draw();
	}
}
import base from '../settings/base.json' assert { type: 'json' };
import avatars from '../settings/avatars.json' assert { type: 'json' };

import { Drawing } from './drawing.js';
import { deployment } from '../battlefield/deployment.js';
import { terrain } from '../battlefield/terrain.js';
import { scaleToLen, sub, add, len, mul } from '../utils/vec2.js';
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
		this.unitBase = base[unit.name] ?? [15];
		this.selected = false;
		this.loadAvatar();
	}
	loadAvatar() {
		if (avatars[this.name] !== undefined) {
			this.avatar = new Image(this.unitBase[0], this.unitBase[0]);
			this.avatar.src = `image/circle_${avatars[this.name]}`;
		}
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

		if (this.avatar !== undefined) {
			this.ctx.drawImage(this.avatar, this.position[0] - mmToInch(base[0] / 2), this.position[1] -  mmToInch(base[0] / 2), mmToInch(base[0]), mmToInch(base[0]));
		} else {

			this.fillPath(() => {
				this.ctx.ellipse(this.position[0], this.position[1], mmToInch(base[0] / 2), mmToInch(base[0] / 2), 0, 0, 2 * Math.PI);
			});
		}


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

class Animation extends Drawing {
	constructor(ctx, fromPoint, toPoint) {
		super();
		this.ctx = ctx;
		this.fromPoint = fromPoint;
		this.toPoint = toPoint;
		this.isFinished = false;
	}
	frame(timestamp) {
		const toTarget = sub(this.toPoint, this.fromPoint);
		if (this.start === undefined) {
			this.start = timestamp
		}
		if (timestamp - this.start > 400) {
			this.end();
		}
		this.ctx.fillStyle = "orange";
		const bullet = add(this.fromPoint, scaleToLen(toTarget, len(toTarget) * (timestamp - this.start) /400));

		this.fillPath(() => {
			this.ctx.ellipse(bullet[0], bullet[1], 0.3, 0.3, 0, 0, 2 * Math.PI);
		});

		if (this.isFinished || len(sub(this.toPoint, bullet)) >= len(toTarget)) {
			return;
		}
	}
	end() {
		this.isFinished = true;
	}
}
export class Scene extends Drawing {
	players = [];
	units = [];
	models = [];
	bindings = [];
	animations = [];
	prevAnimationTimeStamp = 0;
	constructor(ctx, state, gameSettings) {
		super();
		this.ctx = ctx;
		this.players = state.players;
		this.units = state.units;
		this.battlefield = new Battlefield(ctx, state.battlefield);
		this.models = state.units.map(unit => {
			return unit.models.map(id => new Model(ctx, unit, state.models[id]));
		}).flat();
		this.gameSettings = gameSettings;

	}

	async init() {
		await this.battlefield.init()
		this.draw()
	}

	draw() {
		this.battlefield.draw();
		this.models.forEach(model => model.draw());
		this.bindings.forEach(binding => binding.draw());

		const animationFrame = (timestamp) => {
			if (timestamp - this.prevAnimationTimeStamp < 30) {
				requestAnimationFrame(animationFrame);
				return
			}
			this.prevAnimationTimeStamp = timestamp;
			this.battlefield.draw();
			this.models.forEach(model => model.draw());
			this.bindings.forEach(binding => binding.draw());
			
			this.animations.forEach(animation => {
				if (animation.isFinished) {
					return;
				}
				animation.frame(timestamp);
			})
			requestAnimationFrame(animationFrame);

		}
		if (this.animations.length > 0) {
			requestAnimationFrame(animationFrame);
		}
}

	drawOrder(order) {
		console.log(order)
		if (order === null) {
			return;
		}
		if (order.ation === "NEXT_PHASE") {
			this.animations.forEach(animation => {
				animation.end();
			});
			this.animation = [];
		}
		if (order.action === "SHOOT" && this.units[order.target] !== undefined) {
			let targetPosition;
			for (let targetModel of this.units[order.target].models) {
				if (!isNaN(this.models[targetModel].position[0])) {
					targetPosition = this.models[targetModel].position;
					break;
				}
			}
			if (!this.models[order.id].position || targetPosition === undefined) {
				return;
			}
			this.animations.push(new Animation(this.ctx, this.models[order.id].position, targetPosition));
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
		const currentTerrain = (new terrain[this.battlefield.battlefield.terrain]);
		if (playerState?.shootingTargeting !== undefined) {
			for (let weaponName in playerState.shootingTargeting) {
				for (let shooterId in playerState.shootingTargeting[weaponName]) {
					const weapon = this.gameSettings.rangedWeapons[shooterId].find(w => w.name === weaponName);
					if (weapon === undefined) {
						break;
					}
					const shooter = state.models[shooterId];
					const weaponRange = parseInt(weapon['Range']);
					playerState.shootingTargeting[weaponName][shooterId].forEach((targetId, index) => {
						const targetPositions = [];

						state.units[targetId].models.forEach(modelId => {
							if (!state.models[modelId].some(isNaN)) {
								targetPositions.push(state.models[modelId])
							}
						});
						const visibleTargets = currentTerrain.filterVisibleFrom(targetPositions, shooter);
						const availableTarget = visibleTargets.find(targetPosition => len(sub(targetPosition, shooter)) <= weaponRange);

						let targetPosition = availableTarget ?? visibleTargets[0] ?? targetPositions[0];
						if (targetPosition === undefined) {
							return;
						}
						let isVisible = visibleTargets.length > 0;
			
						const toTarget = sub(shooter, targetPosition);
						const weaponPosition = add(shooter, mul([0.1, 0.1], index));
						this.bindings.push(new Binding(this.ctx, weaponPosition, targetPosition, 'red'));

						if (isVisible) {
							const rangeEnd = add(targetPosition, scaleToLen(toTarget, len(toTarget) - Math.min(parseInt(weaponRange), len(toTarget))));
							this.bindings.push(new Binding(this.ctx,weaponPosition, rangeEnd, 'green'));
						}
					});
				}
			}
		}
		this.draw();
	}
}

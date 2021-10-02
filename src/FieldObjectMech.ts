import { Sprite, Texture } from 'pixi.js';
import { FieldObject } from './FieldObject';
import { Animator } from './Scripts/Animator';
import { tex } from './utils';
import { add, rotate, V } from './VMath';

export class FieldObjectMech extends FieldObject {
	animPrev?: Texture;

	animatorLegs: Animator;

	animatorTorso: Animator;

	sprLegs: Sprite;

	sprTorso: Sprite;

	movement: V = { x: 0, y: 0 };

	canShoot = true;

	shooting = false;

	controlType: 'tank' | 'orbit' = 'orbit';

	rotation = 0;

	hpMax = 100;

	hp = 100;

	heatMax = 100;

	heat = 0;

	overheated = false;

	get dead() {
		return this.hp <= 0;
	}

	constructor(public character: string) {
		super('error', true);
		this.sprLegs = this.spr;
		this.animatorLegs = this.animator;
		this.sprTorso = new Sprite(tex(`error`));
		this.sprTorso.anchor.x = 0.5;
		this.sprTorso.anchor.y = 1.0;
		this.display.container.addChild(this.sprTorso);
		// this.sprTorso.y -= 60;

		this.scripts.push(
			(this.animatorTorso = new Animator(this, { spr: this.sprTorso }))
		);
	}

	update() {
		// update position
		if (this.controlType === 'orbit') {
			// orbit controls
			const movement = rotate(this.movement, -this.rotation);
			this.transform.x += movement.x * 4;
			this.transform.y += movement.y * 4;
		} else {
			// tank controls
			const { movement } = this;
			this.transform.x += Math.sin(this.rotation) * movement.y * 4;
			this.transform.y += Math.cos(this.rotation) * movement.y * 4;
			this.rotation += -movement.x / 20;
		}

		// update animation
		if (Math.abs(this.movement.x) > 0) {
			this.animatorLegs.setAnimation(`${this.character}_strafe_bottom.`, {
				1: 2,
				2: 2,
				15: 2,
				16: 2,
			});
			this.sprLegs.scale.x = -Math.sign(this.movement.x);
			this.animatorLegs.freq = 1 / 50;
		} else if (Math.abs(this.movement.y) > 0) {
			this.animatorLegs.freq = 1 / 50;
			this.sprLegs.scale.x = 1;
			this.animatorLegs.setAnimation(`${this.character}_forward_bottom.`);
		} else {
			this.animatorLegs.setAnimation(`${this.character}_idle_bottom.`);
			this.sprLegs.scale.x = 1;
			this.animatorLegs.freq = 1 / 200;
		}

		if (this.overheated) {
			this.animatorTorso.setAnimation(`${this.character}_idle_top.`);
			this.animatorTorso.freq = 1 / 200;
		} else if (this.shooting) {
			this.animatorTorso.setAnimation(`${this.character}_shoot_top.1`);
			this.animatorTorso.freq = 1 / 50;
		} else {
			this.animatorTorso.setAnimation(`${this.character}_idle_top.`);
			this.animatorTorso.freq = 1 / 200;
		}

		this.movement.x = 0;
		this.movement.y = 0;

		if (this.shooting) {
			if (this.canShoot && !this.overheated) {
				this.canShoot = false;
				this.heat += 20;
				this.display.container.emit(
					'shoot',
					add(this.transform, rotate({ x: -30, y: -10 }, -this.rotation)),
					-this.rotation
				);
			}
		} else {
			this.canShoot = true;
		}

		const couldShoot = this.animatorTorso.frame === 0;

		this.heat -= 1;
		if (this.heat <= 0) {
			this.heat = 0;
			this.overheated = false;
		}
		if (this.heat > this.heatMax) {
			this.heat = this.heatMax;
			this.overheated = true;
		}
		if (this.hp < 0) {
			this.hp = 0;
		}
		if (this.hp > this.hpMax) {
			this.hp = this.hpMax;
		}

		super.update();
		if (!couldShoot && !this.canShoot) {
			this.canShoot = this.animatorTorso.frame === 0;
		}
	}
}

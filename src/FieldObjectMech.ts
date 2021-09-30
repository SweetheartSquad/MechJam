import { Sprite, Texture } from 'pixi.js';
import { FieldObject } from './FieldObject';
import { Animator } from './Scripts/Animator';
import { tex } from './utils';
import { rotate, V } from './VMath';

export class FieldObjectMech extends FieldObject {
	animPrev?: Texture;

	animatorLegs: Animator;

	animatorTorso: Animator;

	sprLegs: Sprite;

	sprTorso: Sprite;

	movement: V = { x: 0, y: 0 };

	shooting = false;

	controlType: 'tank' | 'orbit' = 'orbit';

	rotation = 0;

	constructor(public character: string) {
		super('error', true);
		this.sprLegs = this.spr;
		this.animatorLegs = this.animator;
		this.animatorLegs.setAnimation(`${character}_legs_idle.`);
		this.sprTorso = new Sprite(tex(`${character}_torso_idle.`));
		this.sprTorso.anchor.x = 0.5;
		this.sprTorso.anchor.y = 1.0;
		this.sprTorso.filters = this.sprLegs.filters;
		this.display.container.addChildAt(this.sprTorso, 0);
		this.sprTorso.y -= 60;

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
			this.animatorLegs.setAnimation(`${this.character}_strafeRight.`, {
				1: 2,
				2: 2,
				15: 2,
				16: 2,
			});
			this.sprLegs.scale.x = Math.sign(this.movement.x);
			this.animatorLegs.freq = 1 / 50;
		} else if (Math.abs(this.movement.y) > 0) {
			this.animatorLegs.freq = 1 / 300;
			this.sprLegs.scale.x = 1;
			this.animatorLegs.setAnimation(`${this.character}_forward`);
		} else {
			this.animatorLegs.setAnimation(`${this.character}_legs_idle.`);
			this.sprLegs.scale.x = 1;
			this.animatorLegs.freq = 1 / 200;
		}

		if (this.shooting) {
			this.animatorTorso.setAnimation(`${this.character}_shoot.1`);
			this.animatorTorso.freq = 1 / 50;
		} else {
			this.animatorTorso.setAnimation(`${this.character}_torso_idle.`);
			this.animatorTorso.freq = 1 / 200;
		}

		this.movement.x = 0;
		this.movement.y = 0;
		super.update();
	}
}

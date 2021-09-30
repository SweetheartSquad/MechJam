import { Sprite, Texture } from 'pixi.js';
import { FieldObject } from './FieldObject';
import { Animator } from './Scripts/Animator';
import { tex } from './utils';
import { V } from './VMath';

export class FieldObjectMech extends FieldObject {
	animPrev?: Texture;

	animatorLegs: Animator;

	animatorTorso: Animator;

	sprLegs: Sprite;

	sprTorso: Sprite;

	movement: V = { x: 0, y: 0 };

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
		this.movement.x = 0;
		this.movement.y = 0;
		super.update();
	}
}

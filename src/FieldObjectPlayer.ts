import { Sprite, Texture } from 'pixi.js';
import { FieldObject } from './FieldObject';
import { GameScene } from './GameScene';
import { getActiveScene } from './main';
import { Animator } from './Scripts/Animator';
import { size } from './size';
import { tex } from './utils';

export class FieldObjectPlayer extends FieldObject {
	animPrev?: Texture;

	animatorLegs: Animator;

	animatorTorso: Animator;

	sprLegs: Sprite;

	sprTorso: Sprite;

	constructor(spr: string, outline?: boolean) {
		super(spr, outline);
		this.sprLegs = this.spr;
		this.sprTorso = new Sprite(tex('rhinobot_torso_idle.'));
		this.sprTorso.anchor.x = 0.5;
		this.sprTorso.anchor.y = 1.0;
		this.sprTorso.filters = this.sprLegs.filters;
		this.display.container.addChildAt(this.sprTorso, 0);
		this.sprTorso.y -= 60;

		this.animatorLegs = this.animator;
		this.scripts.push(
			(this.animatorTorso = new Animator(this, { spr: this.sprTorso }))
		);
	}

	update() {
		this.animPrev = this.spr.texture;
		super.update();
		if (
			this.animPrev !== this.spr.texture &&
			(this.animator.frame === 0 ||
				this.animator.frame === Math.floor(this.animator.frameCount / 2)) &&
			!this.animator.animation.includes('idle')
		) {
			(getActiveScene() as GameScene).kick(0, 2);
		}
		this.display.container.x = size.x / 2;
		this.display.container.y = size.y;
		this.display.container.scale.x = this.display.container.scale.y = 1;
		this.display.container.alpha = 1;
		this.display.container.visible = true;
		this.display.container.zIndex = size.y;
	}
}

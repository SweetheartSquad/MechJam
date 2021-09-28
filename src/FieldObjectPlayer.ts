import { Texture } from 'pixi.js';
import { FieldObject } from './FieldObject';
import { GameScene } from './GameScene';
import { getActiveScene } from './main';
import { size } from './size';

export class FieldObjectPlayer extends FieldObject {
	animPrev?: Texture;

	update() {
		this.animPrev = this.spr.texture;
		super.update();
		if (
			this.animPrev !== this.spr.texture &&
			this.animator.frame === 0 &&
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

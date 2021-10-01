import { FieldObjectMech } from './FieldObjectMech';
import { GameScene } from './GameScene';
import { getActiveScene } from './main';
import { size } from './size';

export class FieldObjectPlayer extends FieldObjectMech {
	constructor(character: string) {
		super(character);
		this.display.container.pivot.y -= 20;
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

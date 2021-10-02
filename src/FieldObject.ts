import { OutlineFilter } from 'pixi-filters';
import { Sprite } from 'pixi.js';
import { getAlphaFilter } from './AlphaFilter';
import { GameObject } from './GameObject';
import { Animator } from './Scripts/Animator';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';
import { size } from './size';
import { tex } from './utils';
import { V } from './VMath';

export class FieldObject extends GameObject {
	static threed: (pos: V) => V & { z: number };

	spr: Sprite;

	transform: Transform;

	display: Display;

	animator: Animator;

	constructor(spr: string, outline?: boolean) {
		super();
		this.scripts.push((this.transform = new Transform(this)));
		this.scripts.push((this.display = new Display(this)));
		this.spr = new Sprite(tex(spr));
		this.spr.anchor.x = 0.5;
		this.spr.anchor.y = 1.0;
		this.display.container.filters = [getAlphaFilter()];
		if (outline) {
			this.display.container.filters.unshift(new OutlineFilter(1, 0xffffff));
		}
		this.display.container.addChild(this.spr);
		this.scripts.push(
			(this.animator = new Animator(this, { spr: this.spr, freq: 1 / 300 }))
		);
	}

	update() {
		super.update();
		const p = FieldObject.threed(this.transform);
		this.display.container.x = p.x;
		this.display.container.y = p.y;
		this.display.container.zIndex = p.z * size.y;
		this.display.container.scale.x = this.display.container.scale.y = p.z;
		this.display.container.alpha =
			1 +
			// fade out far away
			Math.min(0, p.z - 0.35) * 15 -
			// fade out near cam
			Math.max(0, (p.y - size.y + 10) / 30);
		// clipping
		this.display.container.visible =
			this.display.container.scale.x < 0.01 ||
			this.display.container.alpha < 0.01 ||
			this.display.container.y < size.y + this.display.container.height;
	}
}

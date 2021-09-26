import { Sprite, Texture } from 'pixi.js';
import { game, resources } from '../Game';
import { GameObject } from '../GameObject';
import { Script } from './Script';

function getFrameCount(animation: string): number {
	let count = 0;
	// eslint-disable-next-line no-empty
	while (resources[`${animation}${count + 1}`]?.texture) {
		++count;
	}
	return count;
}

let offset = 0;

export class Animator extends Script {
	spr: Sprite;

	freq: number;

	offset: number;

	frameCount!: number;

	frame!: number;

	animation!: string;

	constructor(
		gameObject: GameObject,
		{ spr, freq = 1 / 200 }: { spr: Sprite; freq?: number }
	) {
		super(gameObject);
		this.spr = spr;
		this.freq = freq;
		this.offset = ++offset;
		this.setAnimation(spr.texture.textureCacheIds[0]);
	}

	setAnimation(a: string) {
		if (this.animation === a) return;
		const [animation, index] = a.split(/(\d+)$/);
		this.animation = animation;
		this.frameCount = getFrameCount(animation);
		this.frame = (this.frameCount ? parseInt(index, 10) - 1 : 0) || 0;
		this.updateTexture();
	}

	updateTexture() {
		this.spr.texture =
			resources[
				this.frameCount ? `${this.animation}${this.frame + 1}` : this.animation
			]?.texture || (resources.error.texture as Texture);
	}

	update(): void {
		if (!this.frameCount) return;
		const curTime = game.app.ticker.lastTime;
		this.frame =
			Math.floor(curTime * this.freq + this.offset * 0.5) % this.frameCount;
		this.updateTexture();
	}
}

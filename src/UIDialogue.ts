import { Graphics } from '@pixi/graphics';
import { Sprite } from '@pixi/sprite';
import { BitmapText } from '@pixi/text-bitmap';
import { backOut, bounceOut, quadOut } from 'eases';
import { getAlphaFilter } from './AlphaFilter';
import { fontDialogue } from './font';
import { GameObject } from './GameObject';
import { Display } from './Scripts/Display';
import { size } from './size';
import { TweenManager } from './Tweens';
import { delay, tex, wrap } from './utils';

const margin = 20;
const padding = 5;
const h = 50;
const w = Math.floor(size.x * 0.4);

export class UIDialogue extends GameObject {
	display: Display;

	sprPortraitEnemy: Sprite;

	sprPortraitPlayer: Sprite;

	graphicsEnemy: Graphics;

	graphicsPlayer: Graphics;

	textPlayer: BitmapText;

	textEnemy: BitmapText;

	textwrap = 0;

	constructor() {
		super();
		this.scripts.push((this.display = new Display(this)));
		this.sprPortraitEnemy = new Sprite(tex('portrait_enemy'));
		this.sprPortraitPlayer = new Sprite(tex('portrait_player'));
		this.graphicsEnemy = new Graphics();
		this.graphicsPlayer = new Graphics();
		this.textPlayer = new BitmapText('', fontDialogue);
		this.textEnemy = new BitmapText('', fontDialogue);
		this.display.container.addChild(this.graphicsEnemy);
		this.display.container.addChild(this.graphicsPlayer);
		this.display.container.addChild(this.sprPortraitEnemy);
		this.display.container.addChild(this.sprPortraitPlayer);
		this.display.container.addChild(this.textPlayer);
		this.display.container.addChild(this.textEnemy);
		this.sprPortraitEnemy.filters =
			this.sprPortraitPlayer.filters =
			this.textEnemy.filters =
			this.textPlayer.filters =
				[getAlphaFilter()];

		this.textwrap = 15;
		this.sprPortraitEnemy.anchor.x = 1.0;
		this.sprPortraitEnemy.x = size.x - margin;
		this.sprPortraitEnemy.y = margin;
		this.sprPortraitPlayer.anchor.y = 1.0;
		this.sprPortraitPlayer.x = margin;
		this.sprPortraitPlayer.y = size.y - margin;
		this.textEnemy.x = size.x - margin - w + padding;
		this.textEnemy.y = margin + padding;
		this.textPlayer.x = margin + this.sprPortraitPlayer.width + padding;
		this.textPlayer.y = size.y - margin - h + padding;
		this.textEnemy.alpha =
			this.textPlayer.alpha =
			this.sprPortraitEnemy.alpha =
			this.sprPortraitPlayer.alpha =
			this.graphicsEnemy.alpha =
			this.graphicsPlayer.alpha =
				0;
	}

	drawBoxes(graphics: Graphics, t: number) {
		graphics.clear();
		if (t <= 0.01) return;
		graphics.lineStyle(1, 0xffffff);
		graphics.beginFill(0, 0.75);
		if (graphics === this.graphicsPlayer) {
			graphics.drawRoundedRect(
				margin + this.sprPortraitPlayer.width / 2,
				size.y - margin - h,
				(w - this.sprPortraitPlayer.width / 2) * t,
				h,
				4
			);
		} else {
			graphics.drawRoundedRect(
				size.x - margin - w * t,
				margin,
				(w - this.sprPortraitEnemy.width / 2) * t,
				h,
				4
			);
		}
	}

	private doSay(
		toSay: string,
		text: BitmapText,
		portrait: Sprite,
		graphics: Graphics
	) {
		const wrapped = wrap(toSay, this.textwrap);
		text.text = wrapped;
		if (text.alpha < 1) {
			TweenManager.tween(portrait, 'alpha', 1, 500, undefined, bounceOut);
			TweenManager.tween(graphics, 'alpha', 1, 500, undefined, (t) => {
				this.drawBoxes(graphics, backOut(t));
				return bounceOut(t);
			});
			delay(500).then(() => {
				TweenManager.tween(text, 'alpha', 1, 500, undefined, bounceOut);
				TweenManager.tween(text, 'alpha', 1, 500, undefined, bounceOut);
			});
		}
		delay(2000).then(() => {
			if (text.text !== wrapped) return;
			TweenManager.tween(text, 'alpha', 0, 200, undefined, bounceOut);
			TweenManager.tween(graphics, 'alpha', 0, 300, undefined, (t) => {
				this.drawBoxes(graphics, 1 - quadOut(t));
				return bounceOut(t);
			});
			TweenManager.tween(portrait, 'alpha', 0, 500, undefined, bounceOut);
		});
	}

	sayEnemy(text: string) {
		this.doSay(text, this.textEnemy, this.sprPortraitEnemy, this.graphicsEnemy);
	}

	sayPlayer(text: string) {
		this.doSay(
			text,
			this.textPlayer,
			this.sprPortraitPlayer,
			this.graphicsPlayer
		);
	}

	say(player: string, enemy: string) {
		this.sayPlayer(player);
		this.sayEnemy(enemy);
	}
}

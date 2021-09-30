import { quadIn, quadOut, quartIn } from 'eases';
import { Howl } from 'howler';
import { BitmapText, Container, Graphics, TilingSprite } from 'pixi.js';
import { getAlphaFilter } from './AlphaFilter';
import { Camera } from './Camera';
import { FieldObject } from './FieldObject';
import { FieldObjectMech } from './FieldObjectMech';
import { FieldObjectPlayer } from './FieldObjectPlayer';
import { filterTextOutline, fontLog } from './font';
import { game, resources } from './Game';
import { GameObject } from './GameObject';
import { getInput } from './main';
import { ScreenFilter } from './ScreenFilter';
import { Animator } from './Scripts/Animator';
import { size } from './size';
import { TweenManager } from './Tweens';
import {
	andList,
	delay,
	randRange,
	shuffle,
	slerp,
	tex,
	toggleFullscreen,
	wrap,
} from './utils';
import { add, magnitude2, rotate, subtract, V } from './VMath';

export class GameScene extends GameObject {
	delay = delay;

	shuffle = shuffle;

	andList = andList;

	tween = TweenManager.tween;

	toggleFullscreen = toggleFullscreen;

	debug = process.env.NODE_ENV === 'development';

	container = new Container();

	containerUI = new Container();

	graphics = new Graphics();

	camera = new Camera();

	screenFilter: ScreenFilter;

	logs: Container[] = [];

	bg: TilingSprite;

	uiCompass: TilingSprite;

	uiMinimap: Graphics = new Graphics();

	fg: TilingSprite;

	animatorBg: Animator;

	animatorFg: Animator;

	queue: (() => Promise<void> | void)[] = [];

	busy = false;

	musicPlaying?: {
		music: string;
		howl: Howl;
		id: number;
		volume: number;
		rate: number;
	};

	constructor() {
		super();

		this.bg = new TilingSprite(tex('bg'), size.x, size.y);
		const texCompass = tex('compass');
		this.uiCompass = new TilingSprite(
			texCompass,
			size.x / 2,
			texCompass.height
		);
		this.uiCompass.anchor.x = 0.5;
		this.uiCompass.x = size.x / 2;

		this.uiMinimap.x = 10;
		this.uiMinimap.y = 10;

		this.fg = new TilingSprite(tex('fg'), size.x, size.y);
		this.scripts.push(
			(this.animatorBg = new Animator(this, { spr: this.bg, freq: 1 / 800 }))
		);
		this.scripts.push(
			(this.animatorFg = new Animator(this, { spr: this.fg, freq: 1 / 800 }))
		);

		this.screenFilter = new ScreenFilter();
		this.screenFilter.uniforms.overlay = [0, 0, 0, 1];
		this.camera.display.container.filters = [this.screenFilter];
		this.blackout();

		this.camera.display.container.x -= size.x / 2;
		this.camera.display.container.y -= size.y / 2;
		this.camera.display.container.addChild(this.container);

		// grid
		for (let x = -this.fieldRadius * 1.5; x < this.fieldRadius * 1.5; x += 50) {
			for (
				let y = -this.fieldRadius * 1.5;
				y < this.fieldRadius * 1.5;
				y += 50
			) {
				const fo = new FieldObject('marker');
				fo.transform.x = x;
				fo.transform.y = y;
				this.containerField.addChild(fo.display.container);
				this.fieldObjects.push(fo);
			}
		}

		// border
		const borders = 200;
		for (let i = 0; i < borders; ++i) {
			const fo = new FieldObject('marker_edge');
			fo.transform.x = Math.sin((i / borders) * Math.PI * 2) * this.fieldRadius;
			fo.transform.y = Math.cos((i / borders) * Math.PI * 2) * this.fieldRadius;
			this.containerField.addChild(fo.display.container);
			this.fieldObjects.push(fo);
		}

		// props
		for (let i = 0; i < 20; ++i) {
			const fo = new FieldObject('tree');
			fo.transform.x = randRange(-this.fieldRadius, this.fieldRadius);
			fo.transform.y = randRange(-this.fieldRadius, this.fieldRadius);
			this.containerField.addChild(fo.display.container);
			this.fieldObjects.push(fo);
		}
		const mech = new FieldObjectMech('rhinobot');
		mech.transform.x = this.fieldRadius;
		this.containerField.addChild(mech.display.container);
		this.fieldObjects.push(mech);

		this.player = new FieldObjectPlayer('rhinobot');
		this.enemy = new FieldObjectMech('rhinobot');
		this.enemy.sprLegs.tint = 0xff0000;
		this.enemy.sprTorso.tint = 0xff0000;
		this.enemy.transform.x = 30;
		this.enemy.transform.y = 30;
		this.containerField.addChild(this.player.display.container);
		this.containerField.addChild(this.enemy.display.container);

		this.container.addChild(this.bg);
		this.container.addChild(this.containerField);
		this.container.addChild(this.graphics);
		this.container.addChild(this.containerUI);

		this.containerUI.addChild(this.fg);
		this.containerUI.addChild(this.uiCompass);
		this.containerUI.addChild(this.uiMinimap);

		this.container.interactiveChildren = false;
		// @ts-ignore
		this.container.accessibleChildren = false;
	}

	containerField = new Container();

	player: FieldObjectPlayer;

	enemy: FieldObjectMech;

	fieldObjects: FieldObject[] = [];

	rotationField = 0;

	fieldRadius = 500;

	destroy(): void {
		this.container.destroy({
			children: true,
		});
		this.camera.destroy();
	}

	update(): void {
		const curTime = game.app.ticker.lastTime;
		const input = getInput();

		const controlType: 'tank' | 'orbit' = input.interact ? 'tank' : 'orbit';

		if (controlType === 'orbit') {
			// orbit controls
			const movement = rotate(input.move, -this.rotationField);
			this.player.transform.x += movement.x * 4;
			this.player.transform.y += movement.y * 4;
			const rotation =
				-Math.atan2(
					this.enemy.transform.y - this.player.transform.y,
					this.enemy.transform.x - this.player.transform.x
				) -
				Math.PI / 2;
			this.rotationField = slerp(this.rotationField, rotation, 0.1);
		} else {
			// tank controls
			const movement = input.move;
			this.player.transform.x += Math.sin(this.rotationField) * movement.y * 4;
			this.player.transform.y += Math.cos(this.rotationField) * movement.y * 4;
			this.rotationField += -movement.x / 20;
		}

		const mp = magnitude2(this.player.transform);
		if (mp > this.fieldRadius * this.fieldRadius) {
			const a = Math.atan2(this.player.transform.y, this.player.transform.x);
			this.player.transform.x = Math.cos(a) * this.fieldRadius;
			this.player.transform.y = Math.sin(a) * this.fieldRadius;
		}

		this.bg.tilePosition.x =
			(this.rotationField / Math.PI / 2) * this.bg.texture.width +
			curTime / 1000;
		this.uiCompass.tilePosition.x =
			(this.rotationField / Math.PI) * 0.5 * this.uiCompass.texture.width;

		const origin = this.player.display.container.position;

		FieldObject.threed = (pos: V) => {
			const relative = subtract(pos, this.player.transform);
			const rotated = rotate(relative, this.rotationField);
			const near = 0.15;
			const far = this.fieldRadius / 2;
			const horizon = 0.66;
			// bob
			// near += Math.sin(curTime / 100) * 0.002;

			let { y } = rotated;
			y /= size.y;
			y -= 0.3;
			if (y !== 0) {
				y = -(
					(-((far + near) / (far - near)) * y +
						(2 * far * near) / (near - far)) /
					-y
				);
				y = Math.abs(quartIn(y)) * Math.sign(y);
			}
			const z = 1 + y;
			y *= size.y;
			// lower horizon
			y *= horizon;

			// z = lerp(c1, c2, z) * size.y;
			// rotated.y *= 0.33;
			// rotated.y =
			// 	Math.abs(quadOut(rotated.y / size.y) * size.y) * Math.sign(rotated.y);

			return {
				...add(origin, { x: rotated.x, y }),
				z,
			};
		};

		const minimapScale = (size.y / (this.fieldRadius * 2)) * 0.2;
		this.uiMinimap.clear();
		this.uiMinimap.lineStyle(1, 0xffffff);
		this.uiMinimap.beginFill(0, 0.75);
		this.uiMinimap.drawCircle(0, 0, this.fieldRadius * minimapScale);
		this.uiMinimap.lineStyle(0);
		this.uiMinimap.beginFill(0x00ff00);
		this.uiMinimap.drawCircle(
			this.player.transform.x * minimapScale,
			this.player.transform.y * minimapScale,
			2
		);
		this.uiMinimap.endFill();
		this.uiMinimap.lineStyle(1, 0x00ff00);
		this.uiMinimap.moveTo(
			this.player.transform.x * minimapScale,
			this.player.transform.y * minimapScale
		);
		this.uiMinimap.lineTo(
			(this.player.transform.x - Math.sin(this.rotationField) * 100) *
				minimapScale,
			(this.player.transform.y - Math.cos(this.rotationField) * 100) *
				minimapScale
		);
		this.uiMinimap.lineStyle(0);
		this.uiMinimap.endFill();
		this.uiMinimap.beginFill(0xff0000);
		this.uiMinimap.drawCircle(
			this.enemy.transform.x * minimapScale,
			this.enemy.transform.y * minimapScale,
			2
		);
		this.uiMinimap.endFill();
		this.uiMinimap.x = 10 + this.uiMinimap.width / 2;
		this.uiMinimap.y = 10 + this.uiMinimap.height / 2;

		// player animation
		this.player.movement.x = input.move.x;
		this.player.movement.y = input.move.y;

		this.screenFilter.uniforms.curTime = curTime;
		this.screenFilter.uniforms.camPos = [
			this.camera.display.container.pivot.x,
			-this.camera.display.container.pivot.y,
		];

		super.update();
		const u = this.update;
		this.update = () => {};
		GameObject.update();
		this.update = u;
		TweenManager.update();
		this.containerField.sortChildren();
		this.containerUI.x = this.camera.display.container.pivot.x;
		this.containerUI.y = this.camera.display.container.pivot.y;

		if (!this.busy && this.queue.length) {
			this.busy = true;
			const next = this.queue.shift();
			const p = (next as NonNullable<typeof next>)();
			if (p) {
				p.then(() => {
					this.busy = false;
				}).catch((err) => {
					this.error(err);
					this.busy = false;
				});
			}
		}
	}

	async log(log: string) {
		this.sfx('sfx0');
		const textLog = new BitmapText(wrap(log, 20), fontLog);
		textLog.x = size.x - (fontLog.fontSize as number) * 20 - 40;
		textLog.y = 40;
		textLog.anchor.y = 1.0;
		textLog.alpha = 0;
		textLog.filters = [filterTextOutline, getAlphaFilter()];
		const containerLog = new Container();
		containerLog.x = 0;
		containerLog.y = 0;
		containerLog.addChild(textLog);
		if (this.logs.length) {
			const lastLog = this.logs[this.logs.length - 1];
			containerLog.addChild(lastLog);
		}
		this.logs.push(containerLog);
		game.app.stage.addChild(containerLog);
		const t1 = TweenManager.tween(textLog, 'alpha', 1, 200, undefined, quadOut);
		const t2 = TweenManager.tween(
			containerLog,
			'y',
			textLog.height + 10,
			200,
			undefined,
			quadOut
		);
		await delay(5000);
		TweenManager.abort(t1);
		const t3 = TweenManager.tween(textLog, 'alpha', 0, 200, undefined, quadIn);
		await delay(200);
		TweenManager.abort(t2);
		TweenManager.abort(t3);
		this.logs.splice(this.logs.indexOf(containerLog), 1);
		containerLog.destroy({ children: true });
	}

	async error(err: unknown) {
		console.error(err);
		this.log(
			'Error: Something went wrong! If you see this, please contact us and let us know what you were doing when it happened.'
		);
	}

	howl(howl: string) {
		const h = resources[howl]?.data as Maybe<Howl>;
		if (!h) {
			console.warn(`Audio "${howl}" not found`);
			this.log(`Audio "${howl}" not found`);
		}
		return h;
	}

	sfx(
		sfx: string,
		{ rate = 1, volume = 1 }: { rate?: number; volume?: number } = {}
	) {
		const howl = this.howl(sfx);
		if (!howl) return undefined;
		const id = howl.play();
		howl.rate(rate, id);
		howl.volume(volume, id);
		return id;
	}

	music(
		music: string,
		{
			rate = 1,
			volume = 0.5,
			fade = 1000,
		}: { rate?: number; volume?: number; fade?: number } = {}
	) {
		const playing = this.musicPlaying;
		if (
			playing?.music === music &&
			playing.volume === volume &&
			playing.rate === rate
		)
			return undefined;
		if (playing) {
			playing.howl.fade(playing.volume, 0, fade, playing.id);
			delay(fade).then(() => {
				playing.howl.stop(playing.id);
			});
		}
		this.musicPlaying = undefined;
		if (!music) return undefined;
		const howl = this.howl(music);
		if (!howl) return undefined;
		const id = howl.play();
		howl.rate(rate, id);
		howl.loop(true, id);
		howl.fade(0, volume, fade, id);
		this.musicPlaying = {
			music,
			howl,
			id,
			volume,
			rate,
		};
		return id;
	}

	overlay(
		[r, g, b, a = 1]:
			| [number, number, number]
			| [number, number, number, number],
		duration = 200
	) {
		this.screenFilter.uniforms.overlay = [r, g, b, a];
		TweenManager.tween(
			this.screenFilter.uniforms.overlay,
			'3',
			0,
			duration,
			undefined,
			quadIn
		);
	}

	blackout(duration = 200) {
		this.overlay([0, 0, 0], duration);
	}

	whiteout(duration = 200) {
		this.overlay([1, 1, 1], duration);
	}

	invert(duration = 200) {
		TweenManager.tween(
			this.screenFilter.uniforms,
			'invert',
			0,
			duration,
			1,
			quadIn
		);
	}

	buzz(amount = 1, duration = 200) {
		TweenManager.tween(
			this.screenFilter.uniforms,
			'uNoise',
			0.2,
			duration,
			amount,
			quadOut
		);
	}

	shake(intensity = 5, duration = 200) {
		TweenManager.tween(
			this.camera.display.container,
			'alpha',
			1,
			duration,
			undefined,
			(t) => {
				const tt = quadOut(1 - t);
				this.camera.display.container.pivot.y =
					this.camera.targetPivot.y + randRange(intensity, -intensity) * tt;
				this.camera.display.container.pivot.x =
					this.camera.targetPivot.x + randRange(intensity, -intensity) * tt;
				return 0;
			}
		);
	}

	kick(x = 0, y = 0) {
		this.camera.display.container.pivot.x += x;
		this.camera.display.container.pivot.y += y;
	}
}

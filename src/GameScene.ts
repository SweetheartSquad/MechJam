import { quadIn, quadOut, quartIn } from 'eases';
import { Howl } from 'howler';
import {
	BitmapText,
	Container,
	Graphics,
	Sprite,
	TilingSprite,
	utils,
} from 'pixi.js';
import { ai } from './ai';
import { getAlphaFilter } from './AlphaFilter';
import { Camera } from './Camera';
import { dialogue } from './dialogue';
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
import { UIDialogue } from './UIDialogue';
import {
	andList,
	clamp,
	delay,
	lerp,
	randItem,
	randRange,
	removeFromArray,
	shuffle,
	slerp,
	tex,
	toggleFullscreen,
	wrap,
} from './utils';
import {
	add,
	angleBetween,
	distance2,
	magnitude2,
	rotate,
	subtract,
	V,
} from './VMath';

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

	uiHpPlayer: Graphics = new Graphics();

	uiHeat: Graphics = new Graphics();

	uiHpEnemy: Graphics = new Graphics();

	hitmarker = 0;

	fg: Sprite;

	uiMiddle: Sprite;

	uiAngle: Sprite;

	uiOverlay: Sprite;

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

	paused = true;

	gameover = false;

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
		this.uiCompass.y = 25;

		this.fg = new Sprite(tex('fg'));
		this.uiOverlay = new Sprite(tex('blank'));
		this.uiMiddle = new Sprite(tex('ui_middle'));
		this.uiAngle = new Sprite(tex('ui_angle'));
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
		this.makeProps();

		this.player = new FieldObjectPlayer('player');
		this.enemy = new FieldObjectMech('enemy');
		this.player.hpMax = 3;
		this.enemy.hpMax = 10;
		this.enemy.sprTorso.y += 4;
		this.enemy.sprLegs.tint = 0xff0000;
		this.enemy.sprTorso.tint = 0xff0000;
		this.player.transform.y = this.fieldRadius * 0.5;
		this.enemy.transform.y = -this.fieldRadius * 0.5;
		this.containerField.addChild(this.player.display.container);
		this.containerField.addChild(this.enemy.display.container);

		this.container.addChild(this.bg);
		this.container.addChild(this.containerField);
		this.container.addChild(this.graphics);
		this.container.addChild(this.containerUI);

		this.containerUI.addChild(this.fg);
		this.fg.addChild(this.uiMiddle);
		this.fg.addChild(this.uiAngle);
		this.uiAngle.x = 80;
		this.uiAngle.y = size.y * 0.5;
		this.uiAngle.anchor.y = this.uiAngle.anchor.x = 0.5;
		this.uiMiddle.anchor.y = this.uiMiddle.anchor.x = 0.5;
		this.uiMiddle.x = size.x * 0.5;
		this.uiMiddle.y = size.y * 0.5;
		this.containerUI.addChild(this.uiHpEnemy);
		this.containerUI.addChild(this.uiCompass);
		this.containerUI.addChild(this.uiMinimap);
		this.containerUI.addChild(this.uiHpPlayer);
		this.containerUI.addChild(this.uiHeat);
		this.containerUI.addChild(this.uiOverlay);
		this.containerUI.addChild(this.uiDialogue.display.container);

		this.container.interactiveChildren = false;
		// @ts-ignore
		this.container.accessibleChildren = false;

		[this.player, this.enemy].forEach((i) => {
			i.display.container.on('shoot', (pos: V) => {
				const target = i === this.player ? this.enemy : this.player;
				const fo = new FieldObject('bullet');
				fo.transform.x = pos.x;
				fo.transform.y = pos.y;
				// @ts-ignore
				fo.target = target;
				let destroyed = false;
				const rotation =
					-angleBetween(fo.transform, target.transform) +
					Math.PI +
					i.movement.x * 0.25;
				// @ts-ignore
				fo.rotation = rotation;
				const v = rotate({ x: 0, y: -5 + i.movement.y * 2 }, rotation);
				const destroy = () => {
					destroyed = true;
					setTimeout(() => {
						fo.destroy();
						removeFromArray(this.fieldObjects, fo);
						removeFromArray(this.bullets, fo);
					});
				};
				const rgb = utils.hex2rgb(i.spr.tint);
				fo.scripts.push({
					gameObject: fo,
					update: () => {
						if (destroyed) return;
						fo.transform.x += v.x;
						fo.transform.y += v.y;
						if (this.outside(fo, 1.1)) {
							destroy();
						}
						const d = distance2(fo.transform, target.transform);
						fo.spr.tint = utils.rgb2hex(
							rgb.map((c) => lerp(1, c, clamp(0, 1 - d / 50000, 1)))
						);
						if (d < 20 ** 2 && !this.gameover) {
							destroy();

							target.hp -= 1;
							if (target === this.player) {
								this.hurt();
							} else {
								this.poof(fo.transform);
								this.shake(2, 60);
								// @ts-ignore
								TweenManager.tween(this, 'hitmarker', 0, 300, 1, quadIn);
							}
						}
					},
				});
				this.containerField.addChild(fo.display.container);
				this.fieldObjects.push(fo);
				this.bullets.push(fo);
			});
		});

		this.queue.push(async () => {
			this.uiOverlay.texture = tex('start');
			await this.fire();
			this.uiOverlay.texture = tex('blank');
			this.whiteout();
			await this.start();
		});
	}

	containerField = new Container();

	player: FieldObjectPlayer;

	enemy: FieldObjectMech;

	fieldObjects: FieldObject[] = [];

	props: FieldObject[] = [];

	bullets: FieldObject[] = [];

	rotationField = 0;

	fieldRadius = 500;

	uiDialogue = new UIDialogue();

	destroy(): void {
		this.container.destroy({
			children: true,
		});
		this.camera.destroy();
	}

	poof(pos: V) {
		const poof = new FieldObject('blank');
		poof.animator.setAnimation('poof', {
			5: 2,
			6: 3,
			7: 4,
		});
		poof.animator.freq = 1 / 100;
		poof.transform.x = pos.x;
		poof.transform.y = pos.y;
		this.containerField.addChild(poof.display.container);
		poof.scripts.push({
			gameObject: poof,
			update: () => {
				if (poof.animator.frame === poof.animator.frameCount - 1) {
					setTimeout(() => {
						poof.destroy();
						removeFromArray(this.fieldObjects, poof);
					});
				}
			},
		});
		return poof;
	}

	fire() {
		return new Promise<void>((r) => {
			const interval = setInterval(() => {
				if (getInput().shoot) {
					clearInterval(interval);
					r();
				}
			}, 0);
		});
	}

	makeProps() {
		this.props.forEach((i) => {
			i.destroy();
			removeFromArray(this.fieldObjects, i);
		});
		this.props.length = 0;
		for (let i = 0; i < 20; ++i) {
			const fo = new FieldObject(
				randItem(['tree_a', 'tree_b', 'tree_c', 'stump_a'])
			);
			fo.transform.x = randRange(-this.fieldRadius, this.fieldRadius);
			fo.transform.y = randRange(-this.fieldRadius, this.fieldRadius);
			this.containerField.addChild(fo.display.container);
			this.fieldObjects.push(fo);
			this.props.push(fo);
		}
	}

	async restart() {
		await this.delay(2000);
		this.whiteout();
		this.uiOverlay.texture = tex('restart');
		await this.delay(500);
		await this.fire();
		this.uiOverlay.texture = tex('blank');
		this.whiteout();
		this.makeProps();
		this.paused = true;
		this.gameover = false;
		this.player.hp = Infinity;
		this.enemy.hp = Infinity;
		this.player.heat = 0;
		this.enemy.heat = 0;
		this.player.transform.y = this.fieldRadius * 0.5;
		this.enemy.transform.y = -this.fieldRadius * 0.5;
		this.player.transform.x = this.enemy.transform.x = 0;
		this.player.sprTorso.alpha = this.player.sprLegs.alpha = 1;
		this.enemy.sprTorso.alpha = this.enemy.sprLegs.alpha = 1;
		await this.start();
	}

	async start() {
		this.say('start');
		this.log('3');
		await this.delay(1000);
		this.log('2');
		await this.delay(1000);
		this.log('1');
		await this.delay(1000);
		this.log('FIGHT');
		this.overlay([1, 1, 1, 0.1]);
		this.paused = false;
	}

	outside(obj: FieldObject, mult = 1) {
		const mp = magnitude2(obj.transform);
		if (mp > this.fieldRadius * this.fieldRadius * mult) {
			return mp;
		}
		return false;
	}

	private sayRef = 0;

	async say(key: keyof typeof dialogue) {
		const ref = ++this.sayRef;
		const sequence = randItem(dialogue[key]);
		sequence.reduce(async (p, line, idx) => {
			await p;
			if (ref !== this.sayRef) return;
			if (!line) return;
			await this.uiDialogue[idx % 2 ? 'sayEnemy' : 'sayPlayer'](line);
		}, Promise.resolve());
	}

	update(): void {
		const curTime = game.app.ticker.lastTime;
		const input = getInput();

		// push apart
		if (distance2(this.player.transform, this.enemy.transform) < 100 * 100) {
			const a = angleBetween(this.enemy.transform, this.player.transform);
			this.enemy.transform.x += Math.cos(a + Math.PI) * 3;
			this.enemy.transform.y += Math.sin(a + Math.PI) * 3;
			this.player.transform.x += Math.cos(a) * 3;
			this.player.transform.y += Math.sin(a) * 3;
		}

		// keep inside arena
		[this.player, this.enemy].forEach((obj: FieldObject) => {
			const mp = this.outside(obj);
			if (mp) {
				const a = Math.atan2(obj.transform.y, obj.transform.x);
				obj.transform.x = Math.cos(a) * this.fieldRadius;
				obj.transform.y = Math.sin(a) * this.fieldRadius;

				// feedback
				if (obj === this.player) {
					this.overlay([1, 1, 1, 0.1], 100);
					this.shake(1.5, 100);
					this.buzz(0.5, 100);
				}
			}
		});

		this.bg.tilePosition.x =
			(this.rotationField / Math.PI / 2) * this.bg.texture.width +
			curTime / 1000;
		this.uiCompass.tilePosition.x =
			(this.rotationField / Math.PI) * 0.5 * this.uiCompass.texture.width;

		// update cam + mech rotations
		const rotation = angleBetween(this.enemy.transform, this.player.transform);
		this.player.rotation = rotation;
		this.enemy.rotation = rotation + Math.PI;
		this.rotationField = slerp(this.rotationField, rotation, 0.1);

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

		this.uiMinimap.beginFill(0xffffff, 0.75);
		this.bullets.forEach((i) => {
			this.uiMinimap.drawCircle(
				i.transform.x * minimapScale,
				i.transform.y * minimapScale,
				1
			);
		});

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
		this.uiMinimap.x = size.x - 160 + this.uiMinimap.width / 2;
		this.uiMinimap.y = size.y - 60 + this.uiMinimap.height / 2;

		this.uiHpEnemy.x = lerp(
			this.uiHpEnemy.x,
			this.enemy.display.container.x,
			0.1
		);
		this.uiHpEnemy.y = lerp(
			this.uiHpEnemy.y,
			this.enemy.display.container.y,
			0.1
		);
		this.uiHpEnemy.clear();
		this.uiHpEnemy.lineStyle(1, 0xff0000, 0.5);
		const w = this.enemy.display.container.width;
		const h = this.enemy.display.container.height;
		this.uiHpEnemy.drawRoundedRect(
			-w * 0.5 * 1.5,
			-w * 0.5 * 1.5 - h * 0.5,
			w * 1.5,
			w * 1.5,
			2
		);
		const offset = this.player.movement.x * 30;
		this.uiHpEnemy.drawRoundedRect(
			-w * 0.25 * 0.5 + offset,
			-w * 0.25 * 0.5 - h * 0.5,
			w * 0.25,
			w * 0.25,
			4
		);
		this.uiHpEnemy.drawRoundedRect(
			-w * 0.5 * 1.5,
			-w * 0.5 * 1.5 - h * 0.5 - 8,
			w * 1.5,
			6,
			2
		);
		this.uiHpEnemy.lineStyle(0);
		this.uiHpEnemy.beginFill(0xff0000, 0.5);
		this.uiHpEnemy.drawRect(
			-w * 0.5 * 1.5 + 1,
			-w * 0.5 * 1.5 - h * 0.5 - 8 + 1,
			w * 1.5 * (this.enemy.hp / this.enemy.hpMax) - 2,
			4
		);
		this.uiHpEnemy.endFill();
		if (this.hitmarker > 0) {
			this.uiHpEnemy.lineStyle(1, 0xff0000, this.hitmarker);
			this.uiHpEnemy.moveTo(offset - 5, -h * 0.5);
			this.uiHpEnemy.lineTo(offset + 5, -h * 0.5);
			this.uiHpEnemy.moveTo(offset, -h * 0.5 - 5);
			this.uiHpEnemy.lineTo(offset, -h * 0.5 + 5);
		}

		this.uiHpPlayer.x = size.x - 72;
		this.uiHpPlayer.y = size.y - 48;
		this.uiHpPlayer.clear();
		this.uiHpPlayer.lineStyle(1, 0xffffff, 1);
		this.uiHpPlayer.drawRoundedRect(0, -85, 10, 85, 2);
		this.uiHpPlayer.lineStyle(0);
		this.uiHpPlayer.beginFill(0x00ff00, 0.8);
		this.uiHpPlayer.drawRect(
			1,
			-85 + 1 + 83 * (1.0 - this.player.hp / this.player.hpMax),
			8,
			83 * (this.player.hp / this.player.hpMax)
		);

		this.uiHeat.x = size.x - 72;
		this.uiHeat.y = 48;
		this.uiHeat.clear();
		this.uiHeat.lineStyle(1, 0xffffff, 1);
		this.uiHeat.drawRoundedRect(0, 0, 10, 85, 2);
		this.uiHeat.lineStyle(0);
		this.uiHeat.beginFill(0xffff00, 0.8);
		this.uiHeat.drawRect(
			1,
			1,
			8,
			83 * (this.player.heat / this.player.heatMax)
		);
		if (this.player.overheated) {
			this.uiHeat.beginFill(0xff0000, 0.5);
			this.uiHeat.drawRoundedRect(0, 0, 10, 85, 2);
		}

		this.uiAngle.pivot.y = lerp(
			this.uiAngle.pivot.y,
			this.player.movement.y * 10,
			0.1
		);
		this.uiMiddle.pivot.x = lerp(
			this.uiMiddle.pivot.x,
			-this.player.movement.x * size.x * 0.02,
			0.05
		);
		this.uiMiddle.pivot.y = lerp(
			this.uiMiddle.pivot.y,
			-this.player.movement.y * size.y * 0.02,
			0.05
		);

		if (this.player.hp <= 0 || this.enemy.hp <= 0) {
			if (!this.gameover) {
				[this.player, this.enemy].forEach((i) => {
					if (i.hp <= 0) {
						TweenManager.tween(i.sprTorso, 'alpha', 0, 2000);
						TweenManager.tween(i.sprLegs, 'alpha', 0, 2000);
						new Array(100).fill(0).forEach((_, idx) => {
							this.delay(idx * 20).then(() => {
								const p = this.poof(i.transform);
								p.display.container.pivot.x = randRange(
									-i.display.container.width / 2,
									i.display.container.width / 2
								);
								p.display.container.pivot.y = randRange(
									-i.display.container.height / 2,
									i.display.container.height / 2
								);
							});
						});
					}
				});
				this.log(this.player.hp <= 0 ? 'YOU LOSE' : 'YOU WIN');
				this.say(this.player.hp <= 0 ? 'lose' : 'win');
				this.invert();
				this.queue.push(() => this.restart());
			}
			this.gameover = true;
			this.paused = true;
		}

		if (!this.paused) {
			// player input
			this.player.shooting = input.shoot;
			this.player.dashing = input.dash;
			this.player.movement.x = input.move.x;
			this.player.movement.y = input.move.y;
			ai(this, input);
		} else {
			this.enemy.shooting = this.player.shooting = false;
			this.enemy.movement.x = this.player.movement.x = 0;
			this.enemy.movement.y = this.player.movement.y = 0;
		}

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
		this.containerUI.x = lerp(
			this.containerUI.x,
			this.camera.display.container.pivot.x + input.move.x * 3,
			0.1
		);
		this.containerUI.y = lerp(
			this.containerUI.y,
			this.camera.display.container.pivot.y + input.move.y * 3,
			0.1
		);

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
		textLog.x = size.x * 0.5;
		textLog.y = size.y - (fontLog.fontSize ?? 0) - 20;
		textLog.anchor.y = 0.5;
		textLog.anchor.x = 0.5;
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
		this.containerUI.addChild(containerLog);
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
				this.uiAngle.pivot.y += randRange(intensity, -intensity);
				return 0;
			}
		);
	}

	kick(x = 0, y = 0) {
		this.camera.display.container.pivot.x += x;
		this.camera.display.container.pivot.y += y;
		this.uiAngle.pivot.y += y * -5;
	}

	hurt(duration = 200) {
		this.overlay([1, 0, 0, 0.1], duration);
		this.shake(5, duration);
		this.buzz(1, duration);
	}
}

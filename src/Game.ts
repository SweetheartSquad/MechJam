import HowlerMiddleware from 'howler-pixi-loader-middleware';
import {
	Application,
	Loader,
	Renderer,
	SCALE_MODES,
	settings,
	Text,
} from 'pixi.js';
import assets from './assets.txt';
import alpha from './assets/alpha-mask.frag.glsl';
import frag from './assets/postprocess.frag.glsl';
import * as fonts from './font';
import { init } from './main';
import { size } from './size';

// PIXI configuration stuff
settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

class Game {
	app: Application;

	startTime: number;

	constructor() {
		const canvas = document.createElement('canvas');
		this.app = new Application({
			view: canvas,
			width: size.x,
			height: size.y,
			antialias: false,
			backgroundAlpha: 1,
			resolution: 1,
			clearBeforeRender: true,
			backgroundColor: 0x000000,
		});
		this.startTime = Date.now();

		this.app.loader.pre(HowlerMiddleware);
	}

	load({
		onLoad,
		onComplete,
		onError,
	}: {
		onLoad: Loader.OnLoadSignal;
		onComplete: () => void;
		onError: (error: Error) => void;
	}): void {
		this.app.loader.onError.add(onError);
		this.app.loader.add({ name: 'assets', url: assets });
		this.app.loader.onComplete.once(() => {
			const assetResources = (this.app.loader.resources.assets.data as string)
				.trim()
				.split(/\r?\n/)
				.map((i) => ({
					url: `assets/${i}`,
					name: i.split('/').pop()?.split('.')[0] || i,
				}));
			this.app.loader.reset();
			this.app.loader.add(assetResources);
			this.app.loader.add({ name: 'frag', url: frag });
			this.app.loader.add({ name: 'alpha', url: alpha });
			this.app.loader.onLoad.add(onLoad);
			this.app.loader.onComplete.once(onComplete);
			this.app.loader.onComplete.once(init);
			this.app.loader.load();
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			resources = this.app.loader.resources;

			// preload fonts
			Object.values(fonts).forEach((i) => {
				const t = new Text('preload', i);
				t.alpha = 0;
				this.app.stage.addChild(t);
				this.app.stage.render(this.app.renderer as Renderer);
				this.app.stage.removeChild(t);
			});
		});
		this.app.loader.load();
	}
}

export const game = new Game();
// @ts-ignore
window.game = game;
// eslint-disable-next-line import/no-mutable-exports
export let resources: Loader['resources'];

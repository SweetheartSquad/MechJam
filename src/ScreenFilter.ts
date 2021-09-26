import { Texture, WRAP_MODES } from 'pixi.js';
import { CustomFilter } from './CustomFilter';
import { resources } from './Game';
import { size } from './size';

export class ScreenFilter extends CustomFilter<{
	overlay: [number, number, number, number];
	invert: number;
	curTime: number;
	camPos: [number, number];
	size: [number, number];
	ditherGridMap: Texture;
}> {
	constructor() {
		super(resources.frag.data);
		this.uniforms.overlay = [0, 0, 0, 0];
		this.uniforms.invert = 0;
		this.uniforms.curTime = 0;
		this.uniforms.camPos = [0, 0];
		this.uniforms.size = [size.x, size.y];
		(resources.ditherGrid.texture as Texture).baseTexture.wrapMode =
			WRAP_MODES.REPEAT;
		this.uniforms.ditherGridMap = resources.ditherGrid.texture as Texture;
		this.padding = 0;
	}
}

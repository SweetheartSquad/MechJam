import { CustomFilter } from './CustomFilter';
import { resources } from './Game';
import { size } from './size';

export class ScreenFilter extends CustomFilter<{
	overlay: [number, number, number, number];
	invert: number;
	curTime: number;
	camPos: [number, number];
	size: [number, number];
	uNoise: number;
}> {
	constructor() {
		super(resources.frag.data);
		this.uniforms.overlay = [0, 0, 0, 0];
		this.uniforms.invert = 0;
		this.uniforms.curTime = 0;
		this.uniforms.camPos = [0, 0];
		this.uniforms.uNoise = 0.2;
		this.uniforms.size = [size.x, size.y];
		this.padding = 0;
	}
}

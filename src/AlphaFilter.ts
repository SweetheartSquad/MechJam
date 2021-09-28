import { Texture, WRAP_MODES } from 'pixi.js';
import { CustomFilter } from './CustomFilter';
import { resources } from './Game';

class AlphaFilter extends CustomFilter<{
	ditherGridMap: Texture;
	uSize: [number, number];
}> {
	constructor() {
		super(resources.alpha.data);
		(resources.ditherGrid.texture as Texture).baseTexture.wrapMode =
			WRAP_MODES.REPEAT;
		this.uniforms.ditherGridMap = resources.ditherGrid.texture as Texture;
		this.uniforms.uSize = [
			this.uniforms.ditherGridMap.width,
			this.uniforms.ditherGridMap.height,
		];
		this.padding = 0;
	}
}

let alphaFilter: AlphaFilter;

export function getAlphaFilter() {
	if (!alphaFilter) alphaFilter = new AlphaFilter();
	return alphaFilter;
}

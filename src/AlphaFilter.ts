import { Texture, WRAP_MODES } from 'pixi.js';
import { CustomFilter } from './CustomFilter';
import { resources } from './Game';

class AlphaFilter extends CustomFilter<{
	ditherGridMap: Texture;
}> {
	constructor() {
		super(resources.alpha.data);
		(resources.ditherGrid.texture as Texture).baseTexture.wrapMode =
			WRAP_MODES.REPEAT;
		this.uniforms.ditherGridMap = resources.ditherGrid.texture as Texture;
		this.padding = 0;
	}
}

let alphaFilter: AlphaFilter;

export function getAlphaFilter() {
	if (!alphaFilter) alphaFilter = new AlphaFilter();
	return alphaFilter;
}

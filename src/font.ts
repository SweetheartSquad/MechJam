import { OutlineFilter } from 'pixi-filters';
import type { IBitmapTextStyle } from 'pixi.js';

export const fontDialogue: Partial<IBitmapTextStyle> = {
	fontName: 'fontfnt',
	fontSize: 8,
	align: 'left',
};

export const fontLog: Partial<IBitmapTextStyle> = {
	fontName: 'fontfnt',
	fontSize: 12,
	align: 'left',
};

export const filterTextOutline = new OutlineFilter(4, 0, 1);

import { OutlineFilter } from 'pixi-filters';
import type { IBitmapTextStyle } from 'pixi.js';

export const fontLog: Partial<IBitmapTextStyle> = {
	fontName: 'fontfnt',
	fontSize: 12,
	align: 'left',
};

export const fontAnnounce: Partial<IBitmapTextStyle> = {
	fontName: 'fontfnt',
	fontSize: 40,
	align: 'center',
};

export const fontDescription: Partial<IBitmapTextStyle> = {
	fontName: 'fontfnt',
	fontSize: 12,
	align: 'center',
};

export const fontDmg: Partial<IBitmapTextStyle> = {
	fontName: 'fontfnt',
	fontSize: 16,
	align: 'center',
};

export const fontName: Partial<IBitmapTextStyle> = {
	fontName: 'fontfnt',
	fontSize: 16,
	align: 'center',
	letterSpacing: -1,
};

export const filterTextOutline = new OutlineFilter(4, 0, 1);

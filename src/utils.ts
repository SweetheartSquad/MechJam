import { Howler } from 'howler';
import { DisplayObject, Point, Texture } from 'pixi.js';
import { resources } from './Game';
import { getInput } from './main';

export const zero = new Point(0, 0);

export function delay(time: number) {
	return new Promise<void>((r) => setTimeout(r, time));
}

// linear interpolation
export function lerp(from: number, to: number, t: number): number {
	if (Math.abs(to - from) < 0.0000001) {
		return to;
	}
	return from + (to - from) * t;
}

export function slerp(from: number, to: number, by: number): number {
	from /= Math.PI * 2;
	to /= Math.PI * 2;
	while (to - from > 0.5) {
		from += 1;
	}
	while (to - from < -0.5) {
		from -= 1;
	}
	return ((from + by * (to - from)) % 1) * Math.PI * 2;
}

// returns v, clamped between min and max
export function clamp(min: number, v: number, max: number): number {
	return Math.max(min, Math.min(v, max));
}

let muted = false;
export function toggleMute(): void {
	if (muted) {
		Howler.mute(false);
	} else {
		Howler.mute(true);
	}
	muted = !muted;
}

export function ease(t: number): number {
	/* eslint-disable */
	if ((t /= 0.5) < 1) {
		return 0.5 * t * t * t;
	}
	return 0.5 * ((t -= 2) * t * t + 2);
	/* eslint-enable */
}

// returns the smallest power-of-2 which contains v
export function nextPowerOfTwo(v: number): number {
	return 2 ** Math.ceil(Math.log(v) / Math.log(2));
}

// returns fractional part of number
export function fract(v: number): number {
	return v - Math.floor(Math.abs(v)) * Math.sign(v);
}

export function randItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function reduceSum(sum: number, item: number): number {
	return sum + item;
}

const grayscaleCoefficients = [0.2126, 0.7152, 0.0722];
export function reduceGrayscale(
	sum: number,
	item: number,
	idx: number
): number {
	return sum + item * grayscaleCoefficients[idx];
}
export function contrastDiff(
	a: [number, number, number],
	b: [number, number, number]
) {
	return a.reduce(
		(sum, _, idx) =>
			sum +
			Math.abs(
				a[idx] * grayscaleCoefficients[idx] -
					b[idx] * grayscaleCoefficients[idx]
			),
		0
	);
}
export function removeFromArray<T>(array: T[], item: T) {
	const idx = array.indexOf(item);
	if (idx !== -1) {
		array.splice(idx, 1);
	}
}

export function randRange(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

export function btn(spr: DisplayObject, title: string, hint?: string) {
	spr.interactive = true;
	spr.interactiveChildren = true;
	spr.buttonMode = true;
	spr.tabIndex = 0;
	spr.accessible = true;
	spr.accessibleTitle = title;
	spr.accessibleHint = hint;
}

export function tex(texture: string) {
	let t = resources[texture]?.texture;
	if (t) return t;
	t = resources[`${texture}1`]?.texture;
	if (t) return t;
	return resources.error.texture as Texture;
}

/** get word-wrapped string (assuming monospace) */
export function wrap(str: string, max: number) {
	const words = str.split(/(\s)/);
	let s = '';
	let w = '';
	const rows = [];
	for (let i = 0; i < words.length; ++i) {
		const word = words[i];
		if (word.length > max) {
			words.splice(i, 1, `${word.slice(0, max - 1)}-`, word.slice(max - 1));
			--i;
			continue;
		}
		if (s.length + w.length + word.trim().length > max || word === '\n') {
			rows.push(s);
			s = '';
			w = '';
		}
		if (word.trim() === '') {
			w += word.replace('\n', '');
		} else {
			s += w + word;
			w = '';
		}
	}
	rows.push(s.trim());
	return rows.join('\n');
}

export function shuffle<T>(array: T[]) {
	const pool = array.slice();
	const shuffled = [];
	while (pool.length) {
		const i = randItem(pool);
		removeFromArray(pool, i);
		shuffled.push(i);
	}
	return shuffled;
}

export function evalFn(fn: string) {
	// eslint-disable-next-line @typescript-eslint/no-implied-eval
	return Function(
		`"use strict";return ${fn.replace(/\/\*\*[^]*?\*\//m, '').trim()}`
	)();
}

/** helper for handling keyboard/controller navigation on a set of menu options */
export function inputMenu(
	selected: number,
	options: {
		select: () => void;
		focus: () => void;
	}[]
) {
	const input = getInput();
	if (input.interact && selected >= 0) {
		options[selected]?.select();
	} else if (input.justMoved.x !== 0) {
		if (selected < 0) {
			options[0]?.focus();
		} else if (input.justMoved.x > 0) {
			options[(selected + 1) % options.length]?.focus();
		} else if (input.justMoved.x < 0) {
			options[(selected + options.length - 1) % options.length]?.focus();
		}
	}
}

/** helper for generating a string in the format "X and Y" or "X, Y, and Z" */
export function andList(...words: string[] | [string[]]) {
	if (Array.isArray(words[0])) {
		[words] = words;
	}
	if (!words.length) return '';
	if (words.length === 1) return words[0];
	return [words.slice(0, -1).join(', '), words.slice(-1)[0]].join(' and ');
}

export async function toggleFullscreen(element?: HTMLElement) {
	element = document.documentElement;

	const isFullscreen = !!document.fullscreenElement || false;

	await (isFullscreen
		? document.exitFullscreen()
		: element.requestFullscreen());
	return !!document.fullscreenElement;
}

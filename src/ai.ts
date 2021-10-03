import { GameScene } from './GameScene';
import { getInput } from './main';
import { lerp } from './utils';
import { add, angleBetween, distance, V } from './VMath';

let targetDist = 300;
let targetDistV = 50;

export function ai(scene: GameScene, input: ReturnType<typeof getInput>) {
	scene.enemy.shooting = Math.random() > 0.1;
	const calcDanger = (pos: V) => {
		let danger = 0;
		scene.bullets.forEach((i) => {
			// @ts-ignore
			const { target } = i;
			if (target === scene.player) return;
			// @ts-ignore
			const { rotation } = i;
			const a = -angleBetween(i.transform, pos) + Math.PI;
			let d = Math.abs(a - rotation);
			while (d > Math.PI * 2) {
				d -= Math.PI * 2;
			}
			d = Math.PI * 2 - d;
			d -= Math.PI;
			d = Math.max(0, d);
			d /= Math.PI;
			danger += d;
		});
		const dist = Math.abs(targetDist - distance(pos, scene.player.transform));
		if (dist > 50) {
			danger += dist * 0.1;
		}
		return danger;
	};
	targetDist += targetDistV;
	targetDistV += (Math.random() - 0.5) * 10;
	targetDistV *= 0.9;
	targetDist = lerp(targetDist, 300, 0.01);
	if (targetDist < 100) {
		targetDist = lerp(targetDist, 300, 0.1);
	}
	const curDanger = calcDanger(scene.enemy.transform);

	const rDanger = calcDanger(
		add(scene.enemy.transform, scene.enemy.orbit({ x: 1, y: 0 }))
	);
	const lDanger = calcDanger(
		add(scene.enemy.transform, scene.enemy.orbit({ x: -1, y: 0 }))
	);
	const uDanger = calcDanger(
		add(scene.enemy.transform, scene.enemy.orbit({ x: 0, y: 1 }))
	);
	const dDanger = calcDanger(
		add(scene.enemy.transform, scene.enemy.orbit({ x: 0, y: -1 }))
	);
	if (curDanger <= rDanger && curDanger <= lDanger) {
		scene.enemy.movement.x = 0;
	} else if (
		rDanger < lDanger ||
		(rDanger === lDanger && Math.random() > 0.5)
	) {
		scene.enemy.movement.x = 1;
	} else {
		scene.enemy.movement.x = -1;
	}
	if (curDanger <= uDanger && curDanger <= dDanger) {
		scene.enemy.movement.y = 0;
	} else if (
		uDanger < dDanger ||
		(uDanger === dDanger && Math.random() > 0.5)
	) {
		scene.enemy.movement.y = 1;
	} else {
		scene.enemy.movement.y = -1;
	}
}

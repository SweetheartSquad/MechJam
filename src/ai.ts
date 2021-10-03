import { game } from './Game';
import { GameScene } from './GameScene';
import { getInput } from './main';
import { lerp } from './utils';
import { add, angleBetween, clone, distance, magnitude2, V } from './VMath';

let targetDist = 300;
let targetDistV = 50;
let dirChange = 100;
let shootChange = 100;
let speed = 0.1;
let prevHp = 0;

export function ai(scene: GameScene, input: ReturnType<typeof getInput>) {
	if (speed >= 1) {
		speed = 1;
	} else {
		speed += 0.005;
	}
	dirChange -= game.app.ticker.deltaTime;
	shootChange -= game.app.ticker.deltaTime;
	// allow immediate move if lost hp
	if (scene.enemy.hp < prevHp) {
		dirChange = 0;
		speed = 1;
	}

	// arbitrarily shift target distance
	targetDist += targetDistV;
	targetDistV += (Math.random() - 0.5) * 10;
	targetDistV *= 0.9;
	targetDist = lerp(targetDist, 300, 0.01);
	if (targetDist < 100) {
		targetDist = lerp(targetDist, 300, 0.1);
	}

	// calculate danger based on bullet trajectories + target distance
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

	// move away from "danger"
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
	const prevMove = clone(scene.enemy.movement);
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

	// don't rotate if player standing still and no bullets (more likely to shoot player this way)
	if (
		// @ts-ignore
		scene.bullets.filter((i) => i.target === scene.enemy).length <= 0 &&
		Math.abs(scene.player.movement.x) < 1
	) {
		scene.enemy.movement.x = 0;
	}

	// prevent movement changes too often
	if (
		prevMove.x !== scene.enemy.movement.x ||
		prevMove.y !== scene.enemy.movement.y
	) {
		if (dirChange <= 0) {
			dirChange = 50 + Math.random() * 150;
		} else {
			scene.enemy.movement = prevMove;
		}
	}

	const prevShooting = scene.enemy.shooting;
	scene.enemy.shooting = Math.random() > 0.5;
	// higher chance of shooting if player standing still
	if (magnitude2(scene.player.movement) < 1) {
		scene.enemy.shooting = scene.enemy.shooting || Math.random() > 0.5;
	}
	// prevent shooting changes too often
	if (prevShooting !== scene.enemy.shooting) {
		if (shootChange <= 0) {
			shootChange = 50 + Math.random() * 150;
		} else {
			scene.enemy.shooting = prevShooting;
		}
	}
	scene.enemy.movement.x = Math.sign(scene.enemy.movement.x) * speed;
	scene.enemy.movement.y = Math.sign(scene.enemy.movement.y) * speed;
	prevHp = scene.enemy.hp;
}

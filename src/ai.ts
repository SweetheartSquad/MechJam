import { GameScene } from './GameScene';
import { getInput } from './main';
import { lerp } from './utils';

export function ai(scene: GameScene, input: ReturnType<typeof getInput>) {
	// TODO: enemy AI
	scene.enemy.movement.x = lerp(scene.enemy.movement.x, -input.move.x, 0.1);
	scene.enemy.movement.y = lerp(scene.enemy.movement.y, input.move.y, 0.1);
	scene.enemy.shooting = Math.random() > 0.1;
}

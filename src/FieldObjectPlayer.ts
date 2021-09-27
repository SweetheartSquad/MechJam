import { FieldObject } from './FieldObject';
import { size } from './size';

export class FieldObjectPlayer extends FieldObject {
	update() {
		super.update();
		this.display.container.x = size.x / 2;
		this.display.container.y = size.y;
		this.display.container.scale.x = this.display.container.scale.y = 1;
		this.display.container.alpha = 1;
		this.display.container.visible = true;
		this.display.container.zIndex = size.y;
	}
}

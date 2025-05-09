import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Collector } from "../../../../types/collector";
import { createMotion } from "@rbxts/ripple";
import { Janitor } from "@rbxts/janitor";
import { isPlayerNearby } from "../../../../shared/utils/isPlayerNearby";
import { Players } from "@rbxts/services";
import { shakeCamera } from "../../../../shared/utils/shakeCamera";

@Component({ tag: "completed-collector" })
export class completedcollector extends BaseComponent<{}, Collector> implements OnStart {
	motion = createMotion(this.instance.Shell.GetPivot());
	janitor = new Janitor();

	onStart() {
		this.closeVfx();
	}

	closeVfx() {
		const floor = this.instance.Floor;
		const shell = this.instance.Shell;
		const oldCFrame = shell.GetPivot();
		this.motion.tween(floor.CFrame, {
			time: 0.1,
		});
		this.motion.onStep((cframe) => shell.PivotTo(cframe));
		this.janitor.Add(
			this.motion.onComplete(() => {
				if (isPlayerNearby(Players.LocalPlayer, this.instance.PrimaryPart, 30)) {
					shakeCamera(4, 0.5).await();
				} else task.wait(4);
				this.motion.tween(oldCFrame, {
					time: 0.1,
				});
				this.janitor.Cleanup();
				this.motion.start();
				task.spawn(() => {
					while (this.janitor.CurrentlyCleaning) task.wait(0);
					// No longer remove the tag here, let server manage state tags
					// this.instance.RemoveTag("completed-collector");
				});
			}),
		);
		this.motion.start();
	}
}

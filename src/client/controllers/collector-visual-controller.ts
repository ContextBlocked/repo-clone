import { Controller, OnStart } from "@flamework/core";
import { CollectionService } from "@rbxts/services";
import { Collector } from "types/collector";
import { Events } from "../network";
import { createMotion } from "@rbxts/ripple";

@Controller({})
export class CollectorVisualController implements OnStart {
	onStart() {
		Events.collectorActivatedVisuals.connect((collectorId) => this.handleVisualActivation(collectorId));
	}

	private findCollectorInstanceById(collectorId: number): Collector | undefined {
		// Collectors might be tagged 'active-collector' by the time this runs,
		// or still 'ready-collector' depending on timing. Check both if necessary,
		// but 'active-collector' is more likely correct after activation.
		const activeCollectors = CollectionService.GetTagged("active-collector") as Collector[];
		for (const collector of activeCollectors) {
			if (collector.GetAttribute("id") === collectorId) {
				return collector;
			}
		}
		// Fallback check if needed, though less likely
		const readyCollectors = CollectionService.GetTagged("ready-collector") as Collector[];
		for (const collector of readyCollectors) {
			if (collector.GetAttribute("id") === collectorId) {
				warn(`Found collector ${collectorId} with ready tag, expected active tag.`);
				return collector;
			}
		}
		return undefined;
	}

	private handleVisualActivation(collectorId: number) {
		const collectorInstance = this.findCollectorInstanceById(collectorId);

		if (!collectorInstance) {
			warn(`Received collectorActivatedVisuals for ID ${collectorId}, but instance not found in Workspace.`);
			return;
		}
		if (!collectorInstance.IsDescendantOf(game.Workspace)) {
			// This check might be redundant if findCollectorInstanceById only searches Workspace collectors
			warn(
				`Found collector instance for ID ${collectorId}, but it's not in Workspace: ${collectorInstance.Name}`,
			);
			return;
		}

		const readyShell = collectorInstance.FindFirstChild("Shell") as Collector["Shell"] | undefined;

		if (!readyShell) {
			warn(
				`Collector ${collectorInstance.Name} (ID: ${collectorId}) is missing Ready Shell for activation visuals.`,
			);
			return;
		}
		const motion = createMotion(readyShell.GetPivot(), { start: true });
		const currentPivot = readyShell.GetPivot();
		const targetPivot = currentPivot.add(new Vector3(0, 100, 0)); // Move up 100 studs

		motion.tween(targetPivot, { time: 0.5 });
		motion.onStep((cframe) => readyShell.PivotTo(cframe));

		//TODO: --- Animation ---
	}
}

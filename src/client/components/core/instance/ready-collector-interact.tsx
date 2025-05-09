import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Janitor } from "@rbxts/janitor";
import { Players, Workspace } from "@rbxts/services";
import { Collector } from "types/collector";
import { Events } from "../../../network";

// Assuming Collector model has an 'id' attribute (number)
interface CollectorAttributes {
	id: number;
}

@Component({ tag: "ready-collector" })
export class ReadyCollectorInteract extends BaseComponent<CollectorAttributes, Collector> implements OnStart {
	private janitor = new Janitor();
	private clickDetector: ClickDetector | undefined;

	onStart() {
		this.janitor.LinkToInstance(this.instance, false);

		// Ensure there's a primary part or a suitable part to attach the ClickDetector
		const interactionPart = this.instance.PrimaryPart ?? this.instance.FindFirstChildWhichIsA("BasePart");

		if (!interactionPart) {
			warn(
				`Collector ${this.instance.Name} (ID: ${this.attributes.id}) has no PrimaryPart or BasePart for interaction.`,
			);
			return;
		}

		// Create and configure ClickDetector
		this.clickDetector = new Instance("ClickDetector");
		this.clickDetector.MaxActivationDistance = 15; // Match server activation distance
		this.clickDetector.Parent = interactionPart;
		this.janitor.Add(this.clickDetector);

		// Connect to the click event
		this.janitor.Add(
			this.clickDetector.MouseClick.Connect((player) => {
				if (player === Players.LocalPlayer) {
					// Fire the remote event to the server
					Events.activateCollectorRequest.fire(this.attributes.id);
				}
			}),
			"Disconnect",
		);

		// Optional: Add visual cues for interactable state (e.g., highlight, prompt)
		// this.setupVisualCues();
	}

	destroy() {
		this.janitor.Destroy();
	}

	private setupVisualCues() {
		// Example: Show a ProximityPrompt
		this.janitor.Add(
			task.spawn(() => {
				while (this.instance) {
					task.wait(1);
					Workspace.audio.CollectorBeep.Play();
				}
			}),
		);
	}
}

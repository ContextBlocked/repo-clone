import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Events } from "../../../network";
import { Janitor } from "@rbxts/janitor";
import { Loot, LootAttributes } from "../../../../types/lootModel";
import { atom, subscribe } from "@rbxts/charm";
import { lootValues } from "../../../../shared/constants/lootValues";
import Make from "@rbxts/make";

// Define the simplified atom type for the server
type ServerLootAtom = { value: number };

@Component({
	tag: "loot",
	defaults: {
		value: 0, // Default value attribute if not set
	},
})
export class loot extends BaseComponent<LootAttributes, Model> implements OnStart {
	janitor = new Janitor();
	// Server-side atom only needs to track value for destruction logic
	lootAtom = atom<ServerLootAtom>({
		value: this.attributes.value ?? lootValues[this.instance.Name as keyof Loot]?.value ?? 0,
	});
	lastPersonDragging: Player | undefined; // Keep track for network ownership and potential future logic
	personDragging: Player | undefined; // Keep track for network ownership - Now managed by DraggableServer
	onStart() {
		this.janitor.LinkToInstance(this.instance, false);
		if (!this.instance.FindFirstChildOfClass("ClickDetector")) {
			const clickDetector = Make("ClickDetector", {
				MaxActivationDistance: 15, // Adjust as needed
				Parent: this.instance,
			});
			this.janitor.Add(clickDetector);
		}
		this.janitor.Add(
			// Collision reporting still relevant for value updates
			Events.reportCollision.connect((_player, target, value) => {
				// Collision value reported by the client is the *new* value
				// TODO: Add server-side validation/sanity checks for 'value' if needed
				if (target === this.attributes.id) {
					// Directly update the server atom's value
					this.lootAtom({ value: value });
				}
			}),
			"Disconnect",
		);
		// DragDetector is no longer created on the server, it's handled by the client Draggable component
		// Make("DragDetector", { ... }) removed

		// Subscribe to server-side atom changes (primarily for value <= 0 check)
		this.janitor.Add(
			subscribe(this.lootAtom, (state) => {
				// Update the instance attribute whenever the server atom changes
				this.instance.SetAttribute("value", state.value);

				// Check if loot should be destroyed based on server state
				if (state.value <= 0) {
					// Fire destroy event - consider excluding the last dragger if applicable
					if (this.lastPersonDragging) {
						Events.destroyLoot.except(this.lastPersonDragging, this.attributes.id);
					} else {
						Events.destroyLoot.broadcast(this.attributes.id);
					}
					// Add a small delay before destroying to allow the event to send
					task.delay(0.1, () => {
						if (this.instance && this.instance.Parent) {
							this.instance.Destroy(); // Destroy the instance on the server
						}
					});
				}
			}), // Ensure proper cleanup
		);

		// Set initial attribute value
		this.instance.SetAttribute("value", this.lootAtom().value);
		this.instance.AddTag("draggable");
	}

	// Remove unused drag method
	// drag(player: string, active: boolean) {}
}

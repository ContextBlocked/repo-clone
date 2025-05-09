import { BaseComponent, Component } from "@flamework/components";
import { OnStart, OnTick } from "@flamework/core";
import { Workspace } from "@rbxts/services";
import { LootModel } from "types/lootModel";
import { atom, subscribe } from "@rbxts/charm";
import { Janitor } from "@rbxts/janitor";
import { money } from "../../../shared/store/atoms/money-atom";
import { Collector } from "types/collector";

/**
 * Represents a collection zone component. Which is a child of the collector. No matter how many collectors there are,
 * there will be only one collection zone at a time.
 * This component handles the collection of loot within a specified zone.
 * The instance this component is attached to should be "zone", a child of the already typed Collector model.
 *
 * @extends BaseComponent
 * @implements OnStart, OnTick
 */
@Component({ tag: "collection-zone" })
export class CollectionZone extends BaseComponent<{}, Collector["zone"]> implements OnStart, OnTick {
	/**
	 * Janitor instance for managing cleanup.
	 */
	janitor = new Janitor();
	/**
	 * Parameters for overlap detection. We won't use FilterDescendantsInstances dynamically.
	 */
	private overlapParams = new OverlapParams();
	/**
	 * Atom storing the LootModel instances currently detected within this zone.
	 */
	private itemsInZone = atom(new Array<LootModel>());

	/**
	 * Called when the component starts.
	 * Initializes the janitor, sets up overlap parameters, and subscribes to item changes to update the money atom.
	 */
	onStart() {
		this.janitor.LinkToInstance(this.instance, false); // Let Janitor handle instance destruction connection

		// Basic overlap params setup - we filter results later
		this.overlapParams.FilterType = Enum.RaycastFilterType.Exclude; // Exclude the zone part itself
		this.overlapParams.FilterDescendantsInstances = [this.instance];

		// Subscribe to changes in the itemsInZone list to update the *global* money state
		// This only runs the calculation and update if this specific zone is the active one.
		this.janitor.Add(
			subscribe(this.itemsInZone, (items) => {
				let currentZoneTotalValue = 0;
				items.forEach((itemModel) => {
					if (itemModel) {
						currentZoneTotalValue += itemModel.GetAttribute("value") as number;
					}
				});
				// Update the global money state based on the calculated total for *this active zone*.
				// Assumes only ONE zone is active and tagged 'collection-zone' at a time.
				money((prev) => ({
					...prev,
					current: currentZoneTotalValue, // Set current money to the total value in this active zone
				}));
			}),
		);

		// Cleanup logic when the component is destroyed
		this.janitor.Add(() => {
			// If this zone was the active one when destroyed, reset the current money contribution.
			if (this.instance.HasTag("collection-zone")) {
				money((prev) => ({ ...prev, current: 0 }));
			}
			this.itemsInZone([]);
			print(`Collection zone ${this.instance.GetFullName()} component cleaned up.`);
		});
	}

	/**
	 * Called every frame. Checks for loot items within the physical zone bounds.
	 */
	onTick() {
		// Get all BaseParts currently overlapping the zone instance.
		const partsInZone = Workspace.GetPartsInPart(this.instance, this.overlapParams);
		const currentLootModelsInZone = new Set<LootModel>();

		// Iterate through the detected parts to find valid loot models.
		for (const part of partsInZone) {
			// Find the parent Model for the part.
			const model = part.FindFirstAncestorWhichIsA("Model");

			// Check if the model exists and is tagged as "loot".
			if (model && model.HasTag("loot")) {
				currentLootModelsInZone.add(model as LootModel);
			}
		}

		// Compare the newly found set of loot models with the previously stored state.
		const previousLootModels = this.itemsInZone(); // Get current array from atom
		if (
			currentLootModelsInZone.size() !== previousLootModels.size() || // Quick check: size difference means change
			!previousLootModels.every((model) => currentLootModelsInZone.has(model)) // Thorough check: ensure all previous items are still present
		) {
			// If the contents of the zone have changed, update the atom.
			// Convert the Set to an Array for the atom state.
			this.itemsInZone([...currentLootModelsInZone]);
		}
	}
}

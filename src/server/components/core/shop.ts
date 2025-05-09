import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Shop } from "../../../types/shop";
import { CollectionService, ServerStorage, Workspace } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";

@Component({ tag: "shop" })
export class shop extends BaseComponent<{}, Shop> implements OnStart {
	janitor = new Janitor();

	onStart() {
		this.janitor.Add(
			CollectionService.GetInstanceRemovedSignal("shop").Once((instance) => {
				if (this.instance === instance) this.cleanup();
			}),
		);
		this.initialize();
	}

	spawnConsumables() {
		const consumableSpawns = this.instance.consumableSpawns.GetChildren() as Part[];
		consumableSpawns.forEach((spawn) => {
			const randomConsumable = math.random(1, ServerStorage.consumables.GetChildren().size() - 1);
			const consumable = ServerStorage.consumables.GetChildren()[randomConsumable].Clone() as Part;
			consumable.PivotTo(spawn.CFrame);
			consumable.Parent = Workspace;
			spawn.Destroy();
			this.janitor.Add(consumable);
		});
	}

	spawnItems() {
		const itemSpawns = this.instance.itemSpawns.GetChildren() as Part[];
		const items = [...ServerStorage.weapons.GetChildren()];
		itemSpawns.forEach((spawn) => {
			const randomItem = math.random(1, items.size() - 1);
			const item = [...ServerStorage.weapons.GetChildren()][randomItem].Clone() as Part;
			item.PivotTo(spawn.CFrame);
			item.Parent = Workspace;
			spawn.Destroy();
			this.janitor.Add(item);
		});
	}

	initialize() {
		this.instance.Parent = game.Workspace;
		this.spawnConsumables();
		this.spawnItems();
	}

	cleanup() {
		this.janitor.Cleanup();
	}
}

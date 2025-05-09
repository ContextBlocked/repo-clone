import { afterEach, beforeEach, describe, expect, it } from "@rbxts/jest-globals";
import { CollectionService, RunService, ServerStorage, Workspace } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";
import { money, setInitialMoneyState } from "shared/store/atoms/money-atom";
import { Collector } from "types/collector";
import { LootModel } from "types/lootModel";
import { lootValues } from "../../shared/constants/lootValues";

describe("collectionZone", () => {
	let janitor: Janitor;
	let mockCollector: Collector;
	let mockZone: Collector["zone"];
	let mockLootItem1: LootModel;
	let mockLootItem2: LootModel;

	// Function to simulate a RunService heartbeat step to trigger OnTick
	const simulateTick = () => {
		RunService.Heartbeat.Wait(); // Wait for a heartbeat cycle
	};

	beforeEach(() => {
		janitor = new Janitor();

		// Reset money atom
		setInitialMoneyState(1000, 1); // Example goal/required

		// Create mock collector and zone
		mockCollector = ServerStorage.collector.Clone() as Collector;

		mockZone = mockCollector.zone;
		mockCollector.Parent = Workspace;
		janitor.Add(mockCollector);

		// Create mock loot items (using a clonable base part for simplicity in testing)
		const baseLootPart = ServerStorage.loot.Amber;
		mockLootItem1 = baseLootPart.Clone() as unknown as LootModel;
		mockLootItem2 = baseLootPart.Clone() as unknown as LootModel;
		mockLootItem1.Parent = Workspace;
		mockLootItem2.Parent = Workspace;
		janitor.Add(mockLootItem1);
		janitor.Add(mockLootItem2);
		// Initially position loot outside the zone
		mockLootItem1.PivotTo(new CFrame(20, 0.5, 0));
		mockLootItem2.PivotTo(new CFrame(25, 0.5, 0));

		// Add the tag to activate the zone component via Flamework
		CollectionService.AddTag(mockZone, "collection-zone");
		mockLootItem1.SetAttribute("id", 1);
		mockLootItem2.SetAttribute("id", 2);
		CollectionService.AddTag(mockLootItem1, "loot");
		CollectionService.AddTag(mockLootItem2, "loot");

		// Allow Flamework time to potentially initialize components if needed
		task.wait(0.1);
	});

	afterEach(() => {
		janitor.Cleanup();
		// Ensure tags are removed if not cleaned up by janitor linking
		// Reset money again just in case
		setInitialMoneyState(0, 0);
	});

	it("should initialize and link janitor to the instance", () => {
		expect(CollectionService.GetTagged("collection-zone")).toContain(mockZone);
		// Check if janitor cleans up when instance is destroyed (indirect check)
		const initialMoney = money().current;
		mockZone.Destroy();
		simulateTick(); // Allow potential cleanup effects
		expect(money().current).toBe(initialMoney); // Should remain 0 if zone wasn't active or handled cleanup
	});

	it.skip("should detect a loot item entering the zone on tick", () => {
		expect(money().current).toBe(0);

		// Move loot item 1 into the zone
		mockLootItem1.PivotTo(mockZone.CFrame);
		simulateTick(); // Trigger OnTick
		task.wait(0.5); // Allow time for subscription to potentially fire

		expect(money().current).toBe(lootValues[mockLootItem1.Name]); // Check if money updated
	});

	it.skip("should detect a loot item leaving the zone on tick", () => {
		// Move loot item 1 into the zone first
		expect(money().current).toBe(lootValues[mockLootItem1.Name]);

		// Move loot item 1 out of the zone
		mockLootItem1.PivotTo(new CFrame(2000, 0.5, 0));
		simulateTick();
		task.wait(1); // Allow time for subscription to potentially fire

		expect(money().current).toBe(0); // Money should reset to 0
	});

	it("should NOT update the money atom if the zone is inactive (no tag)", () => {
		// Remove the tag *before* moving items in
		CollectionService.RemoveTag(mockZone, "collection-zone");
		simulateTick(); // Allow component removal if necessary

		expect(money().current).toBe(0);

		// Move loot item 1 into the zone
		mockLootItem1.PivotTo(mockZone.CFrame);
		simulateTick();
		task.wait(0.1); // Wait for potential subscription

		// Money should remain unchanged because the zone wasn't tagged 'collection-zone'
		expect(money().current).toBe(0);
	});

	it("should reset money to 0 if the active zone component is destroyed", () => {
		// Move item in to set money
		mockLootItem1.PivotTo(mockZone.CFrame);
		simulateTick();
		task.wait(0.1);
		//expect(money().current).toBe(testLootValue1);

		// Destroy the zone instance
		mockZone.Destroy();
		// Allow time for Janitor cleanup linked to the instance
		task.wait(0.1);

		// The cleanup logic in onStart should reset the money because it had the tag
		expect(money().current).toBe(0);
	});

	it("should ignore parts that are not part of a 'loot' tagged model", () => {
		const nonLootPart = new Instance("Part");
		nonLootPart.Name = "NonLootPart";
		nonLootPart.Size = new Vector3(1, 1, 1);
		nonLootPart.Anchored = true; // Make it easy to position
		nonLootPart.Parent = Workspace;
		janitor.Add(nonLootPart);

		expect(money().current).toBe(0);

		// Move non-loot part into the zone
		nonLootPart.CFrame = mockZone.CFrame;
		simulateTick();
		task.wait(0.1);
		expect(money().current).toBe(0); // Money should not change

		// Move actual loot in as well
		mockLootItem1.PivotTo(mockZone.CFrame.add(new Vector3(1, 0, 0)));
		simulateTick();
		task.wait(0.1);

		//expect(money().current).toBe(testLootValue1); // Money should update for the loot item
	});
});

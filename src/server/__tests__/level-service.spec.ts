import { afterEach, beforeEach, describe, expect, it } from "@rbxts/jest-globals";
import { CollectionService, RunService, ServerStorage, Workspace } from "@rbxts/services";
import { Janitor } from "@rbxts/janitor";
import { levelservice } from "../services/level-service";
import { money, setInitialMoneyState } from "shared/store/atoms/money-atom";
import { LevelState, updateLevelAtom } from "shared/store/atoms/level-state";
import { lootValues } from "shared/constants/lootValues";
import { Collector } from "types/collector";
import { peek } from "@rbxts/charm";

// Mock parts of ServerStorage if needed, or ensure test assets exist

describe("levelservice", () => {
	let janitor: Janitor;

	// Helper to simulate RunService step
	const simulateTick = (count = 1) => {
		for (let i = 0; i < count; i++) {
			RunService.Heartbeat.Wait();
		}
	};

	beforeEach(() => {
		janitor = new Janitor();

		// Reset atoms and static vars
		setInitialMoneyState(0, 0);
		updateLevelAtom(LevelState.Idle);
		levelservice.totalRequiredValue = 0;
		levelservice.requiredCollectors = 0;
		levelservice.janitor = new Janitor(); // Give service a fresh janitor for each test
		janitor.Add(levelservice.janitor); // Add service's janitor to test janitor
	});

	afterEach(() => {
		janitor.Cleanup();
		// Remove tags added during asset creation/tests
		CollectionService.GetTagged("active-collector")?.forEach((i) => i.RemoveTag("active-collector"));
		CollectionService.GetTagged("inactive-collector")?.forEach((i) => i.RemoveTag("inactive-collector"));
		CollectionService.GetTagged("ready-collector")?.forEach((i) => i.RemoveTag("ready-collector"));
		CollectionService.GetTagged("collection-zone")?.forEach((i) => i.RemoveTag("collection-zone"));
	});

	it("should prepare settings for the next level", () => {
		levelservice.prepareSettingsForNextLevel(1, false); // Access private for test
		expect(levelservice.requiredCollectors).toBe(1);
		expect(levelservice.totalRequiredValue).toBeGreaterThanOrEqual(10000);
		expect(money().goal).toBe(levelservice.totalRequiredValue); // Goal per collector = total value here
		expect(money().collectorsRequired).toBe(1);

		levelservice.prepareSettingsForNextLevel(3, true); // Test debug flag
		expect(levelservice.requiredCollectors).toBe(2);
		expect(levelservice.totalRequiredValue).toBe(2); // 1 goal * 2 collectors
		expect(money().goal).toBe(1);
		expect(money().collectorsRequired).toBe(2);
	});

	it("should spawn a map", () => {
		const map = levelservice["spawnMap"](); // Access private for test
		expect(map).toBeDefined();
		expect(map.IsDescendantOf(Workspace)).toBe(true);
		expect(ServerStorage.maps.GetChildren().map((map) => map.Name)).toContain(map.Name); // Check if the map was cloned
	});

	it("should spawn loot in the map", () => {
		const map = levelservice["spawnMap"]();
		levelservice["prepareSettingsForNextLevel"](1, false); // Need settings for goal value
		levelservice["spawnLoot"](map, peek(money).goal); // Access private for test

		const lootItems = map.GetChildren().filter((i) => i.HasTag("loot"));
		expect(lootItems.size()).toBeGreaterThan(0); // Should spawn at least some loot

		let totalSpawnedValue = 0;
		lootItems.forEach((item) => {
			expect(item.GetAttribute("id")).toBeDefined();
			totalSpawnedValue += lootValues[item.Name as keyof typeof lootValues].value ?? 0;
		});

		// Check if spawned value is roughly around the target (goal * 1.2)
		expect(totalSpawnedValue).toBeGreaterThanOrEqual(peek(money).goal); // Should at least meet the goal
		expect(map.FindFirstChild("LootSpawn")).toBeUndefined(); // Check if spawns were destroyed
	});

	it("should throw if no loot spawns found", () => {
		const map = levelservice.spawnMap();
		map.GetChildren()
			.filter((i) => i.HasTag("lootSpawn"))
			.forEach((spawn) => spawn.Destroy()); // Remove all loot spawns
		expect(() => levelservice["spawnLoot"](map, 100)).toThrow("No loot spawn locations found");
	});

	it("should spawn collectors in the map", () => {
		const map = levelservice["spawnMap"]();
		levelservice["prepareSettingsForNextLevel"](1, false); // Need 1 collector
		levelservice["spawnCollectors"](map, 1); // Access private for test

		const collectors = map.GetChildren().filter((i) => i.Name === "collector");
		expect(collectors.size()).toBe(1);

		const collector = collectors[0] as Collector;
		expect(collector).toBeDefined();
		expect(collector.GetAttribute("id")).toBe(0);
		expect(collector.HasTag("active-collector")).toBe(true); // First one is active
		expect(collector.FindFirstChild("zone")?.HasTag("collection-zone")).toBe(true);

		expect(map.FindFirstChild("CollectorSpawn")).toBeUndefined(); // Check if spawn was destroyed
	});

	it("should spawn multiple collectors correctly (active/inactive)", () => {
		const map = levelservice["spawnMap"]();

		levelservice["prepareSettingsForNextLevel"](3, false); // Need 2 collectors
		levelservice["spawnCollectors"](map, 3);

		const collectors = map.GetChildren().filter((i) => i.Name === "collector") as Collector[];
		expect(collectors.size()).toBe(2);

		const collector1 = collectors.find((c) => c.GetAttribute("id") === 0);
		const collector2 = collectors.find((c) => c.GetAttribute("id") === 1);

		expect(collector1).toBeDefined();
		expect(collector1?.HasTag("active-collector")).toBe(true);
		expect(collector1?.FindFirstChild("zone")?.HasTag("collection-zone")).toBe(true);

		expect(collector2).toBeDefined();
		expect(collector2?.HasTag("inactive-collector")).toBe(true);
		expect(collector2?.FindFirstChild("zone")?.HasTag("collection-zone")).toBe(false); // Inactive zone shouldn't be tagged yet
	});

	it("should throw if not enough collector spawns found", () => {
		const map = levelservice["spawnMap"]();
		map.GetChildren()
			.filter((i) => i.HasTag("collector-spawn"))
			.forEach((spawn) => spawn.Destroy()); // Remove all collector spawns
		levelservice["prepareSettingsForNextLevel"](3, false); // Need 2 collectors
		// Only one spawn exists by default in the mock map
		expect(() => levelservice["spawnCollectors"](map, 3)).toThrow(
			`Not enough collector spawn locations found in map ${map.Name}. Needed 2, found 0.`,
		);
	});

	it("should cleanup level correctly", () => {
		// Spawn some items to be cleaned up
		const map = levelservice["spawnMap"]();
		levelservice["prepareSettingsForNextLevel"](1, false);
		levelservice["spawnLoot"](map, peek(money).goal);
		levelservice["spawnCollectors"](map, 1);
		money((prev) => ({ ...prev, current: 50 })); // Set some money

		levelservice.cleanupLevel();

		expect(Workspace.FindFirstChild("TestMap")).toBeUndefined(); // Map should be destroyed by janitor
		expect(levelservice.totalRequiredValue).toBe(0);
		expect(levelservice.requiredCollectors).toBe(0);
		expect(money().current).toBe(0);
		expect(money().goal).toBe(0);
		expect(money().collectorsRequired).toBe(0);
	});

	it("should activate a ready collector", () => {
		const collector = ServerStorage.collector.Clone();
		collector.Name = "ReadyCollector";
		collector.Parent = Workspace;
		collector.AddTag("ready-collector");
		const zone = collector.FindFirstChild("zone")!;
		janitor.Add(collector);

		const result = levelservice.activateCollector(collector); // Test instance method

		expect(result).toBe(true);
		expect(collector.HasTag("ready-collector")).toBe(false);
		expect(collector.HasTag("active-collector")).toBe(true);
		expect(zone.HasTag("collection-zone")).toBe(true);
	});

	it("should not activate a collector that is not ready", () => {
		const collector = ServerStorage.collector.Clone();
		collector.Name = "NotReadyCollector";
		collector.Parent = Workspace;
		collector.AddTag("inactive-collector"); // Not ready
		const zone = collector.FindFirstChild("zone")!;
		janitor.Add(collector);

		const result = levelservice.activateCollector(collector);

		expect(result).toBe(false);
		expect(collector.HasTag("active-collector")).toBe(false);
		expect(zone.HasTag("collection-zone")).toBe(false);
	});
});

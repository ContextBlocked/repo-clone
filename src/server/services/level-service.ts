import { Service } from "@flamework/core";
import { CollectionService, ServerStorage, Workspace } from "@rbxts/services";
import { LootModel } from "../../types/lootModel";
import { Janitor } from "@rbxts/janitor";
import { lootValues } from "../../shared/constants/lootValues";
import { gameAtom } from "../../shared/store/atoms/game-atom";
import { money, setInitialMoneyState } from "../../shared/store/atoms/money-atom";
import { LevelState, updateLevelAtom } from "../../shared/store/atoms/level-state";
import { Collector } from "../../types/collector";
import { peek } from "@rbxts/charm";
import { Events } from "server/network";

/**
 * Strict service responsible for managing only game levels. Any other game logic should be handled outside. ex: game state, player state, etc.
 */
@Service({})
export class levelservice {
	/**
	 * A static reference to the "loot" folder within ServerStorage.
	 */
	static lootFolder = ServerStorage.loot;
	/**
	 * Tracks the total value of loot *required* across all collectors for the current level.
	 */
	static totalRequiredValue = 0;
	/**
	 * Tracks the number of collectors required for the current level.
	 */
	static requiredCollectors = 0;
	/**
	 * Instance of the Janitor class for managing cleanup tasks.
	 */
	static janitor = new Janitor();

	/**
	 * Prepares the level asynchronously, returning a promise that resolves when setup is complete.
	 * @param level The level number to prepare. Defaults to the current level in gameAtom.
	 * @param debug Optional flag for debug settings (e.g., lower goal).
	 * @returns A Promise that resolves when the level is fully prepared.
	 */
	static async PrepareLevel(level?: number, debug?: boolean): Promise<void> {
		await Promise.try(() => {
			level = level ?? gameAtom().level;
			levelservice.prepareSettingsForNextLevel(level, debug);
			updateLevelAtom(LevelState.PreparingSettings);
		});
		await Promise.delay(0);
		const map = levelservice.spawnMap();
		updateLevelAtom(LevelState.SpawningMap);
		await Promise.delay(0);
		levelservice.spawnLoot(map, peek(money).goal);
		updateLevelAtom(LevelState.SpawningLoot);
		await Promise.delay(0);
		levelservice.spawnCollectors(map, level!); // level is guaranteed to be defined here
		updateLevelAtom(LevelState.SpawningCollectors);
		await Promise.delay(0);
		// Note: cleanupLevel is now called *externally* by the state machine in initializeGame
		// when transitioning *out* of the Play state or into Cleanup.
		// It should not be called automatically here during preparation.
		updateLevelAtom(LevelState.Idle); // Mark preparation as complete
		// No explicit cleanupLevel call here anymore.
	}

	/**
	 * Cleans up the current level by destroying spawned assets and resetting level-specific state.
	 * Called externally by the game state manager (e.g., when entering Cleanup state).
	 */
	static cleanupLevel() {
		print("levelservice: Cleaning up level assets...");
		// Clean up map, loot, collectors etc. managed by this service's janitor
		levelservice.janitor.Cleanup();
		print("levelservice: Janitor cleanup complete.");

		// Reset level-specific static variables
		levelservice.totalRequiredValue = 0;
		levelservice.requiredCollectors = 0;
		print("levelservice: Static variables reset.");

		// Reset money/collector state (this might also be handled elsewhere, but good to ensure here)
		setInitialMoneyState(0, 0);
		print("levelservice: Initial money state reset.");
	}

	/**
	 * Activates a specific collector if it's in the 'ready' state.
	 * @param collector The specific Collector instance to activate.
	 * @returns `true` if the collector was successfully activated, `false` otherwise.
	 */
	static activateCollector(collector: Collector): boolean {
		if (!collector.HasTag("ready-collector")) {
			warn(`Attempted to activate collector ${collector.Name}, but it does not have the 'ready-collector' tag.`);
			return false;
		}

		collector.RemoveTag("ready-collector");
		collector.AddTag("active-collector");
		const zone = collector.FindFirstChild("zone");
		if (zone) {
			zone.AddTag("collection-zone");
			print(`Activated collector: ${collector.Name}`);
			return true;
		} else {
			// If the zone is missing, we still activated the collector, but log a warning.
			warn(`Activated collector ${collector.Name} but it is missing its 'zone' child.`);
			return true;
		}
	}

	/**
	 * Prepares the game settings for the upcoming level.
	 * @returns The updated game settings.
	 */
	static prepareSettingsForNextLevel(level: number, debug?: boolean) {
		const goalPerCollector = debug ? 1 : level * 10000 + math.floor(math.random() * 5000); // Example goal calculation per collector
		const requiredCollectors = math.max(1, math.ceil(level / 2)); // Example: 1 collector for levels 1-2, 2 for 3-4, etc.

		levelservice.requiredCollectors = requiredCollectors;
		levelservice.totalRequiredValue = goalPerCollector * requiredCollectors; // Store total needed for loot spawning logic

		setInitialMoneyState(goalPerCollector, requiredCollectors);
	}

	/**
	 * Spawns a randomly selected map from the "map" tag and sets it up for the game.
	 * @returns The spawned map model.
	 */
	static spawnMap() {
		const random = math.random(1, CollectionService.GetTagged("map").size());
		const map = (CollectionService.GetTagged("map")[random - 1] as Model).Clone();
		levelservice.janitor.Add(map);
		map.Parent = Workspace;
		return map;
	}

	/**
	 * Spawns loot items within the specified map based on the game settings.
	 *
	 * @param {Model} map - The map to spawn loot within.
	 * @param goal
	 *
	 * @throws Will throw an error if no loot spawn locations are found.
	 */
	static spawnLoot(map: Model, goal: number) {
		const lootSpawns = new Array<Part>();
		(CollectionService.GetTagged("lootSpawn") as Part[]).forEach((spawnLocation) => {
			if (spawnLocation.Parent === map) {
				lootSpawns.push(spawnLocation);
			}
		});

		if (lootSpawns.size() === 0) {
			throw "No loot spawn locations found";
		}

		let spawnedValue = 0;
		let index = 0;
		// Spawn slightly more loot than strictly required across all collectors
		const targetValue = levelservice.totalRequiredValue * 1.2;

		while (spawnedValue < targetValue) {
			if (lootSpawns.size() === 0) {
				warn("Ran out of loot spawn locations before reaching target value!");
				break;
			}
			const randomForSpawn = math.random(1, lootSpawns.size());
			const lootSpawn = lootSpawns[randomForSpawn - 1];
			const randomForLoot = math.random(1, levelservice.lootFolder.GetChildren().size());
			const loot = levelservice.lootFolder.GetChildren()[randomForLoot - 1].Clone() as LootModel;
			loot.PivotTo(lootSpawn.CFrame);
			const weight = lootValues[loot.Name]?.weight ?? 1; // Assuming weight is part of lootValues
			loot.SetAttribute("weight", weight);
			loot.SetAttribute("id", index);
			loot.AddTag("loot");
			// Remove DragDetector creation
			// if (!loot.FindFirstChildWhichIsA("DragDetector")) { ... }
			loot.Parent = map;
			levelservice.janitor.Add(loot); // Ensure spawned loot is cleaned up

			spawnedValue += lootValues[loot.Name].value ?? 0;
			lootSpawn.Destroy();
			lootSpawns.remove(randomForSpawn - 1);
			index++;
		}
		if (lootSpawns.size() !== 0) {
			// generate some more loot for when players cant find loot or break loot
			const amountToGenerate = math.random(math.ceil(lootSpawns.size() / 3), lootSpawns.size());
			for (let i = 0; i < amountToGenerate; i++) {
				const randomForSpawn = math.random(1, lootSpawns.size());
				const lootSpawn = lootSpawns[randomForSpawn - 1];
				const randomForLoot = math.random(1, levelservice.lootFolder.GetChildren().size());
				const loot = levelservice.lootFolder.GetChildren()[randomForLoot - 1].Clone() as LootModel;

				loot.PivotTo(lootSpawn.CFrame);

				// Add weight attribute (example, get from lootValues or define elsewhere)
				const weight = lootValues[loot.Name]?.weight ?? 1; // Assuming weight is part of lootValues
				loot.SetAttribute("weight", weight);
				loot.SetAttribute("id", index);
				loot.AddTag("loot");
				// Remove DragDetector creation
				// if (!loot.FindFirstChildWhichIsA("DragDetector")) { ... }
				loot.Parent = map;
				levelservice.janitor.Add(loot); // Ensure spawned loot is cleaned up
				spawnedValue += lootValues[loot.Name].value ?? 0;
				lootSpawn.Destroy();
				lootSpawns.remove(randomForSpawn - 1);
				index++;
			}
		}
		lootSpawns.forEach((spawnLocation) => {
			spawnLocation.Destroy();
		});
	}

	/**
	 * Spawns collectors at designated locations within the game map based on the provided game settings.
	 *
	 * @param {Model} map - The game map where collectors will be spawned.
	 * @param level
	 *
	 * @throws Will throw an error if no collector spawn locations are found or not enough for the required amount.
	 */
	static spawnCollectors(map: Model, _level: number) {
		// level parameter no longer needed directly
		const collectorLocations = CollectionService.GetTagged("collector-spawn") as Part[];
		const availableSpawns = new Array<Part>();

		// Filter collector locations that are children of the specified map
		collectorLocations.forEach((spawn) => {
			if (spawn.IsDescendantOf(map)) {
				availableSpawns.push(spawn);
			}
		});

		// Check if enough spawn locations were found
		if (availableSpawns.size() < levelservice.requiredCollectors) {
			throw `Not enough collector spawn locations found in map ${map.Name}. Needed ${
				levelservice.requiredCollectors
			}, found ${availableSpawns.size()}.`;
		}

		for (let i = 0; i < levelservice.requiredCollectors; i++) {
			const randomForSpawn = math.random(1, availableSpawns.size());
			const collectorSpawn = availableSpawns[randomForSpawn - 1];
			const collector = ServerStorage.collector.Clone();

			collector.Parent = map;
			collector.PivotTo(collectorSpawn.CFrame);
			collector.SetAttribute("id", i); // Assign a unique ID based on spawn order
			levelservice.janitor.Add(collector); // Ensure collector is cleaned up

			// Tag the first collector as active, others as inactive
			if (i === 0) {
				collector.AddTag("active-collector");
				Events.collectorActivatedVisuals.broadcast(collector.GetAttribute("id") as number);
				// Ensure the zone of the first collector is tagged
				const zone = collector.FindFirstChild("zone");
				if (zone) {
					zone.AddTag("collection-zone");
				} else {
					warn(`Collector instance ${collector.Name} is missing its 'zone' child.`);
				}
			} else {
				collector.AddTag("inactive-collector");
			}

			collectorSpawn.Destroy();
			availableSpawns.remove(randomForSpawn - 1);
		}

		// Clean up any remaining unused collector spawn locations
		availableSpawns.forEach((collectorLocation) => {
			collectorLocation.Destroy();
		});
	}
}

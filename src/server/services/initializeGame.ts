import { OnStart, Service } from "@flamework/core";
import { CollectionService, Players, RunService, ServerStorage, Workspace } from "@rbxts/services";
import constants from "shared/constants";
import { levelservice } from "./level-service";
import { startCenturion } from "../store/centurion";
import { Janitor } from "@rbxts/janitor";
import { gameAtom, GameState, progressGameAtom, setGameState } from "shared/store/atoms/game-atom";
import { effect, peek, subscribe } from "@rbxts/charm";
import { completeCurrentCollector, money } from "shared/store/atoms/money-atom";
import { Collector } from "types/collector";
import { levelState, LevelState, updateLevelAtom } from "shared/store/atoms/level-state";

@Service({})
export class initializeGame implements OnStart {
	janitor = new Janitor();
	private completionTimerPromise: Promise<number> | undefined = undefined; // Rename and change type

	onStart() {
		constants.characterModel!.ScaleTo(constants.sizes.CHARACTER_SCALE);
		Players.PlayerAdded.Connect((player) => this.PlayerAdded(player));
		startCenturion();
		this.subscribeToMoneyAtom();
	}

	subscribeToGameState() {
		return effect(() => {
			const gameState = gameAtom().state;
			switch (gameState) {
				case GameState.Loading: {
					gameAtom((prev) => ({
						...prev,
						level: prev.level + 1,
						alivePlayers: Players.GetPlayers().map((player) => player.UserId),
					}));
					// Loading screen logic
					// Use Promise.try to wrap the level preparation
					const prepPromise = levelservice
						.PrepareLevel(5, true)
						.andThen(() => {
							// Now transition to Play state *after* preparation is done
							setGameState(GameState.Play);
						})
						.catch((err) => {
							warn("Level preparation failed:", err);
							// Handle error, maybe go back to a different state?
							setGameState(GameState.Cleanup); // Example: go to cleanup on failure
						});
					// Add the promise to the janitor so it can be cancelled if the service stops
					this.janitor.AddPromise(prepPromise as Promise<unknown>);
					break;
				}
				case GameState.Play: {
					// Transition loading screen to play
					gameAtom().alivePlayers.forEach((playerId) => {
						Players.GetPlayerByUserId(playerId)?.LoadCharacter();
					});
					break;
				}
				case GameState.Cleanup: {
					// Cleanup logic using a promise that resolves when LevelState is Idle
					const cleanupCompletePromise = Promise.try(() => {
						const cleanupSub = subscribe(levelState, (state) => {
							if (state === LevelState.Idle) {
								cleanupSub(); // Unsubscribe
								// Resolve the promise
							}
						});
						// Add the unsubscribe function to the janitor
						this.janitor.Add(cleanupSub);
					});

					// Add the promise itself to the janitor for potential cancellation/tracking
					this.janitor.AddPromise(cleanupCompletePromise as Promise<unknown>);

					cleanupCompletePromise
						.andThen(() => {
							progressGameAtom(); // Progress state only after cleanup is confirmed Idle
						})
						.catch((err) => {
							warn("Error during cleanup state monitoring:", err);
							// Handle error, maybe force state progression or retry?
							if (!Promise.Error.isKind(err, Promise.Error.Kind.AlreadyCancelled)) {
								// Potentially force progress or go to an error state if not cancelled
								progressGameAtom();
							}
						});

					updateLevelAtom(LevelState.CleaningUp); // Trigger the cleanup process
					break;
				}
				case GameState.Shop: {
					const shop = ServerStorage.shop.Clone();
					shop.AddTag("shop");
					// Shop logic
					break;
				}
			}
		});
	}

	// REMOVED subscribeToLevelState method

	subscribeToMoneyAtom() {
		return effect(() => {
			const { current, goal, collectorsCompleted, collectorsRequired } = money();

			// Check if the goal for the *current* collector is met
			if (goal > 0 && current >= goal) {
				// Use peek to avoid infinite loops if state changes trigger effects immediately
				const currentGoal = peek(money).goal;
				const currentValue = peek(money).current;

				// Re-verify goal condition (Charm effects usually handle settling, direct check is likely fine)
				const currentMoneyState = peek(money);
				if (currentMoneyState.current >= currentMoneyState.goal && currentMoneyState.goal > 0) {
					// Only start a timer if one isn't already running
					if (this.completionTimerPromise === undefined) {
						this.completionTimerPromise = Promise.delay(5);
						const promiseRef = this.completionTimerPromise; // Capture ref for cleanup scope

						// Add a cleanup function to Janitor that cancels the promise if Janitor cleans up early
						this.janitor.Add(() => {
							promiseRef?.cancel();
						}, true); // true indicates it's a function reference

						// Use finally to clear the reference and remove from Janitor regardless of outcome
						promiseRef.finally(() => {
							this.completionTimerPromise = undefined; // Clear the main reference
						});

						promiseRef
							.andThen(() => {
								// Final check before completing
								if (peek(money).current >= peek(money).goal) {
									this.completeActiveCollector();
								}
							})
							.catch((err) => {
								// Handle cancellation specifically if needed
								if (!Promise.Error.isKind(err, Promise.Error.Kind.AlreadyCancelled)) {
									warn("Error in completion timer promise:", err);
								}
								// Reference is cleared by .finally()
							});
					}
				}
			} else {
				// Goal is NOT met (or goal is 0)
				// If a completion timer is running, cancel it
				if (this.completionTimerPromise !== undefined) {
					this.completionTimerPromise.cancel();
					// Reference and Janitor cleanup is handled by .finally() on the promise
				}
			}
		});
	}

	PlayerAdded(player: Player) {
		player.AddTag("player");
		if (RunService.IsServer()) {
			// Ensure this runs only on the server
			this.subscribeToGameState(); // Call it here
		}
	}

	private completeActiveCollector() {
		const activeCollector = CollectionService.GetTagged("active-collector")[0] as Collector | undefined;

		if (activeCollector) {
			// Mark collector as completed and remove active tags
			activeCollector.RemoveTag("active-collector");
			activeCollector.AddTag("completed-collector"); // Tag for client VFX and state tracking
			const currentMoneyState = peek(money);
			const excessMoney = currentMoneyState.current - currentMoneyState.goal;
			// Calculate excess money *before* resetting
			Promise.delay(1)
				.andThen(() => {
					if (excessMoney > 0) {
						const moneyBagPrefab = ServerStorage.moneyBag;
						if (moneyBagPrefab) {
							const moneyBag = moneyBagPrefab.Clone();
							moneyBag.SetAttribute("value", excessMoney);
							// Assign a unique ID - ensure loot component handles this or use a proper system
							moneyBag.SetAttribute("id", CollectionService.GetTagged("loot").size() + 1);

							// Position it near the collector
							moneyBag.PivotTo(activeCollector.GetPivot().add(new Vector3(0, 3, 0))); // Adjust offset as needed
							moneyBag.Parent = Workspace;
							moneyBag.AddTag("loot");
						} else {
							warn("MoneyBag prefab not found in ServerStorage.loot!");
						}
					}
				})
				.catch((err) => {
					warn("Error during excess money handling:", err);
				});

			// Find and destroy loot within the zone *before* removing the tag or completing
			const zone = activeCollector.FindFirstChild("zone") as BasePart | undefined;
			if (zone) {
				const overlapParams = new OverlapParams();
				overlapParams.FilterType = Enum.RaycastFilterType.Exclude; // Exclude the zone itself
				overlapParams.FilterDescendantsInstances = [zone];

				const partsInZone = Workspace.GetPartsInPart(zone, overlapParams);
				for (const part of partsInZone) {
					const model = part.FindFirstAncestorWhichIsA("Model");
					if (model && model.HasTag("loot")) {
						// Destroy the loot model
						model.Destroy();
						// Optionally, remove from loot state atoms if necessary, though destruction might be enough
						// removeLoot(model.GetAttribute("id") as number); // Example if needed
					}
				}

				// Now remove the zone tag
				zone.RemoveTag("collection-zone");
			} else {
				warn(`Completed collector ${activeCollector.Name} is missing its 'zone' child.`);
			}

			// Update the global money state (increments completed count, resets current)
			completeCurrentCollector();

			// Check if all required collectors are now completed
			const newState = peek(money);
			if (newState.collectorsCompleted >= newState.collectorsRequired) {
				//TODO: Handle level completion logic here, wait for players to return to ship
				// Consider setting game state here if appropriate, e.g., setGameState(GameState.LevelComplete);
			} else {
				// Find the next inactive collector and mark it as ready
				const inactiveCollectors = CollectionService.GetTagged("inactive-collector") as Collector[];
				if (inactiveCollectors.size() > 0) {
					const nextCollectorToReady = inactiveCollectors[0];
					nextCollectorToReady.RemoveTag("inactive-collector");
					nextCollectorToReady.AddTag("ready-collector");
				} else {
					warn(
						"Collector completed, but no more inactive collectors found to mark as ready, though more are required!",
					);
					// This might indicate an issue in level setup or state management
					setGameState(GameState.Cleanup); // Or another appropriate state
				}
			}
		} else {
			warn("Attempted to complete collector, but no active collector found with the 'active-collector' tag!");
		}
	}
}

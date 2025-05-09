import { Networking } from "@flamework/networking";
import { MovementEnum } from "./store/atoms/character/movementAtom";
import { FlattenNestedAtoms, SyncPayload } from "@rbxts/charm-sync";
import { Atom } from "@rbxts/charm";
import { characterState } from "./store/atoms/character";
import { Game } from "types/game-types";
import { levelStore } from "./store/atoms/level-store";

interface ClientToServerEvents {
	activateCollectorRequest: (collectorId: number) => void;

	// OLD drag event - remove or rename if keeping for other purposes
	// drag(value: boolean, target: number): void;

	// NEW Custom Drag Events
	dragStart: (targetInstanceId: number, worldHitPosition: Vector3, relativeHitPosition: Vector3) => void;
	dragUpdate: (targetInstanceId: number, mouseRayDirection: Vector3, desiredDistance: number) => void;
	dragStop: (targetInstanceId: number) => void;

	movementEvent(value: MovementEnum): void;

	reportCollision(target: number, value: number): void;

	requestSyncState(): void;

	start(): void;
}

interface ServerToClientEvents {
	cleanupLevel(): void;

	destroyLoot(lootId: number): void;

	/** Signals clients to play the activation animation and swap visuals for a specific collector using its ID. */
	collectorActivatedVisuals(collectorId: number): void;
}
interface ServerToClientEventsWithoutValidation {
	syncState(
		state: SyncPayload<
			FlattenNestedAtoms<{
				character: Atom<characterState>;
				levelAtom: FlattenNestedAtoms<typeof levelStore>;
				game: Atom<Game>;
			}>
		>,
	): void;
}

interface ClientToServerFunctions {}

interface ServerToClientFunctions {}

export const GlobalEvents = Networking.createEvent<ClientToServerEvents, ServerToClientEvents>();
export const GlobalEventsWithoutValidation = Networking.createEvent<
	ClientToServerEvents,
	ServerToClientEventsWithoutValidation
>();
export const GlobalFunctions = Networking.createFunction<ClientToServerFunctions, ServerToClientFunctions>();

import { Atom, atom } from "@rbxts/charm";

/**
 * Atom holding the ID of the loot item currently being dragged by the local player.
 * Undefined if no item is being dragged locally.
 */
export const locallyDraggedLootId = atom<number | undefined>(undefined);

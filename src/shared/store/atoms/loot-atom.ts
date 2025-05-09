import { atom, Atom } from "@rbxts/charm";

interface Loot {
	dragging: boolean;
	lastViewFrame: CFrame;
	value: number;
}

type LootAtom = {
	[id in number]?: Loot;
};
export const lootAtom: Atom<LootAtom> = atom({});

export function updateLoot(id: number, updates: Loot) {
	return lootAtom((prev) => ({ ...prev, [id]: updates }));
}

export function loadLoot(id: number, loot: Loot) {
	return lootAtom((prev) => ({ ...prev, [id]: loot }));
}

export function removeLoot(id: number) {
	return lootAtom((prev) => ({
		...prev,
		[id]: undefined,
	}));
}

import { flatten } from "@rbxts/charm-sync";
import { lootAtom } from "./loot-atom";
import { money } from "./money-atom";

export const levelStore = flatten({
	money,
	lootAtom,
});

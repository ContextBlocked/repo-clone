import { atom } from "@rbxts/charm";
import Object from "@rbxts/object-utils";

export declare const _G: { __DEV__: boolean };
_G["__DEV__"] = true;

export type Grabbing = Array<string>;

export type LootState = {
	[k in number]?: Grabbing;
};
export const checkLootState = (prev?: LootState, nextState?: LootState): boolean => {
	let isEqual = true;
	if ((prev === undefined && nextState !== undefined) || (prev !== undefined && nextState === undefined))
		return false;
	if (prev === undefined && nextState === undefined) return true;
	Object.entries(nextState!).forEach((value, key) => {
		isEqual = isEqual && prev![key]?.size() === value[1].size();
		print(prev![key], value[1].size());
	});
	print("isEqual", isEqual);
	return isEqual;
};

export const lootState = {
	loot: atom<LootState>({}),
};
export function loadLootState(id: number) {
	return lootState.loot((state) => ({
		...state,
		[id]: state[id] ?? new Array<string>(),
	}))[id];
}
export function updateLootState(id: number, player: string) {
	return lootState.loot((state) => ({
		...state,
		[id]: [...state[id]!, player],
	}))[id];
}
export function removeLootState(id: number, player: string) {
	return lootState.loot((state) => {
		const newState = state[id]?.filter((p) => p !== player);
		return {
			...state,
			[id]: newState,
		};
	});
}
export function selectLootState(id: number) {
	return lootState.loot()[id];
}

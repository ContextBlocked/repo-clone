import { atom } from "@rbxts/charm";

export enum LevelState {
	Idle = "Idle",
	PreparingSettings = "PreparingSettings",
	SpawningMap = "SpawningMap",
	SpawningLoot = "SpawningLoot",
	SpawningCollectors = "SpawningCollectors",
	CleaningUp = "CleaningUp",
}

export const levelAtom = atom<LevelState>(LevelState.Idle);

export function updateLevelAtom(update: LevelState) {
	return levelAtom(update);
}

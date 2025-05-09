import { atom } from "@rbxts/charm";
import { Game } from "../../../types/game-types";

export enum GameState {
	Loading,
	Play,
	Cleanup,
	Shop,
	Prep,
}
export const gameAtom = atom<Game>({
	level: 0,
	state: GameState.Loading,
	alivePlayers: [],
});
export function updateGameAtom(updates: Game) {
	return gameAtom((prev) => ({ ...prev, ...updates }));
}

export function progressGameAtom() {
	return gameAtom((prev) => {
		const nextState = prev.state + 1;
		return GameState[nextState] !== undefined
			? { ...prev, state: GameState[nextState] as unknown as GameState }
			: { ...prev, state: GameState.Cleanup };
	});
}

export function setGameState(state: GameState) {
	return gameAtom((prev) => ({ ...prev, state }));
}

import { GameState } from "../shared/store/atoms/game-atom";

export interface Game {
	level: number;
	state: GameState;
	alivePlayers: number[];
}

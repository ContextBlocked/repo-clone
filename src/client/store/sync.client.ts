import CharmSync from "@rbxts/charm-sync";
import { Events, EventsWithoutValidation } from "../network";
import { characterState } from "../../shared/store/atoms/character";
import { gameAtom } from "../../shared/store/atoms/game-atom";
import { levelStore } from "../../shared/store/atoms/level-store";

export const syncClient = CharmSync.client({
	atoms: CharmSync.flatten({
		character: characterState.players,
		levelAtom: levelStore,
		game: gameAtom,
	}),
});

EventsWithoutValidation.syncState.connect((state) => {
	syncClient.sync(state);
});
Events.requestSyncState.fire();

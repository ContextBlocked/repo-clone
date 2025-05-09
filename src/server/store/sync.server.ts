import CharmSync from "@rbxts/charm-sync";
import { Events, EventsWithoutValidation } from "server/network";
import { characterState } from "../../shared/store/atoms/character";
import { gameAtom } from "../../shared/store/atoms/game-atom";
import { levelStore } from "../../shared/store/atoms/level-store";

export const syncServer = CharmSync.server({
	atoms: CharmSync.flatten({
		character: characterState.players,
		levelAtom: levelStore,
		game: gameAtom,
	}),
	interval: 0,
	preserveHistory: false,
});

syncServer.connect((player, state) => {
	// filter out players that are not in the state
	// filter out unnecessary data
	//print(state);
	EventsWithoutValidation.syncState.fire(player, state);
});

Events.requestSyncState.connect((player) => {
	syncServer.hydrate(player);
});

export default {
	syncServer,
};

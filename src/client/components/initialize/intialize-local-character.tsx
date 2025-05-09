import { Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { usePx } from "../../ui/hooks/usepx";
import Vide, { mount } from "@rbxts/vide";
import { initializeCharacter } from "./initializeCharacter";
import { Players } from "@rbxts/services";
import { Money } from "../../ui/money";
import { startCenturion } from "../../store/centurion";

@Component({ tag: "player-character" })
export class intializelocalcharacter extends initializeCharacter implements OnStart {
	onStart() {
		startCenturion();
		const gui = new Promise((resolve) => {
			const playergui = Players.LocalPlayer.WaitForChild("PlayerGui");
			resolve(playergui);
		})
			.andThen((playerGui) => {
				mount(App, playerGui as PlayerGui);
				return playerGui;
			});
	}
}

function App() {
	usePx();
	return (
		<screengui>
			<Money />
		</screengui>
	);
}

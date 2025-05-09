import { Centurion } from "@rbxts/centurion";
import { CenturionUI } from "@rbxts/centurion-ui";

export const startCenturion = () =>
	Centurion.client()
		.start()
		.then(() => CenturionUI.start(Centurion.client(), {}))
		.catch((err) => warn("Failed to start Centurion:", err));

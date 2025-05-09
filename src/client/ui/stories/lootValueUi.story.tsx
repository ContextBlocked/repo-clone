import { InferVideProps } from "@rbxts/ui-labs";
import Vide from "@rbxts/vide";
import { LootValueUI } from "../instances/lootValueUI";
import { atom } from "@rbxts/charm";

const controls = {
	Value: 50,
	Decrement: false,
};
const storybook = {
	vide: Vide,
	controls: controls,
	story: (props: InferVideProps<typeof controls>) => {
		const lootAtom = atom({
			value: props.controls.Value(),
		});
		return <LootValueUI lootAtom={lootAtom} decrement={props.controls.Decrement()} />;
	},
};
export = storybook;

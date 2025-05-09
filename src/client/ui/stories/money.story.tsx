import { InferVideProps } from "@rbxts/ui-labs";
import Vide from "@rbxts/vide";
import { Money } from "../money";

const controls = {
	Current: 100,
	Goal: 500,
};

const storybook = {
	vide: Vide,
	controls: controls,
	story: (props: InferVideProps<typeof controls>) => {
		return <Money />;
	},
};

export = storybook;

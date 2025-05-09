import { TextLabel } from "./components/textLabel";
import Vide from "@rbxts/vide";
import { useAtom } from "@rbxts/vide-charm";
import { money } from "../../shared/store/atoms/money-atom";

export function Collectors() {
	const required = useAtom(() => money().collectorsRequired); // Use the specific money atom
	const completed = useAtom(() => money().collectorsCompleted);
	return (
		<TextLabel
			Name="CollectorProgress"
			LayoutOrder={2}
			Text={() => `${completed()} / ${required()}`}
			FontFace={
				new Font("rbxasset://fonts/families/Michroma.json", Enum.FontWeight.ExtraBold, Enum.FontStyle.Normal)
			}
			TextColor3={Color3.fromRGB(255, 85, 0)}
			TextSize={36}
			TextXAlignment={Enum.TextXAlignment.Right}
			Size={new UDim2(1, 0, 0, 18)} // Fixed height
			BackgroundTransparency={1}
		/>
	);
}

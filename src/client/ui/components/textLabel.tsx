import Vide from "@rbxts/vide";
import constants from "shared/constants";

interface TextLabelProps {
	children?: Vide.Node;
	native?: Vide.InstanceAttributes<TextLabel>;
	Name?: string;
	AnchorPoint?: Vector2;
	Position?: UDim2;
	Size?: UDim2;
	Text?: Vide.InstanceAttributes<TextLabel>["Text"];
	AutomaticSize?: Enum.AutomaticSize;
	FontFace?: Font;
	BackgroundTransparency?: number;
	LayoutOrder?: number;
	TextColor3?: Color3;
	TextSize?: number;
	TextXAlignment?: Enum.TextXAlignment;
	TextYAlignment?: Enum.TextYAlignment;
	TextDirection?: Enum.TextDirection;
}

export function TextLabel({
	AnchorPoint,
	AutomaticSize,
	BackgroundTransparency,
	FontFace,
	LayoutOrder,
	Name,
	Position,
	Size,
	Text,
	TextColor3,
	TextDirection,
	TextSize,
	TextXAlignment,
	TextYAlignment,
	children,
	native,
}: TextLabelProps) {
	return (
		<textlabel
			{...native}
			AnchorPoint={AnchorPoint}
			Text={Text}
			Name={Name}
			Position={Position}
			Size={Size}
			BackgroundTransparency={BackgroundTransparency}
			AutomaticSize={AutomaticSize}
			FontFace={constants.font}
			LayoutOrder={LayoutOrder}
			TextColor3={TextColor3}
			TextSize={TextSize}
			TextXAlignment={TextXAlignment}
			TextYAlignment={TextYAlignment}
			TextDirection={TextDirection}
		>
			{children}
		</textlabel>
	);
}

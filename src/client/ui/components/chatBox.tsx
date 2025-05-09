import Vide from "@rbxts/vide";

export function ChatBox() {
	return (
		<textbox
			Name="Input"
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundTransparency={1}
			ClearTextOnFocus={false}
			CursorPosition={-1}
			FontFace={new Font("Jura", Enum.FontWeight.Bold, Enum.FontStyle.Normal)}
			LayoutOrder={2}
			Size={new UDim2(0, 0, 1, 0)}
			TextColor3={Color3.fromRGB(242, 255, 0)}
			TextSize={36}
			TextWrapped={true}
			TextXAlignment={Enum.TextXAlignment.Left}
		>
			<uiflexitem FlexMode={Enum.UIFlexMode.Grow} />
		</textbox>
	);
}

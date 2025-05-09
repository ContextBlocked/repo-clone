import Vide, { effect, source, untrack } from "@rbxts/vide";
import { useAtom } from "@rbxts/vide-charm";
import { useMotion } from "@rbxts/pretty-vide-utils";
import { TextLabel } from "./components/textLabel";
import { money } from "../../shared/store/atoms/money-atom";
import { Collectors } from "./collectors"; // Import the specific atom

export function Money() {
	const data = useAtom(money); // Use the specific money atom
	const [currentMoneyBinding, currentMoneyMotion] = useMotion(data().current);
	const goal = source(data().goal); // Use source for values that change less frequently or don't need animation

	effect(() => {
		// Update sources when atom changes
		goal(data().goal);

		// Animate current money
		const newCurrent = data().current;
		// If the goal changed (meaning a new collector was activated), snap the motion to 0 before tweening
		if (untrack(goal) !== data().goal) {
			currentMoneyMotion.set(0); // Snap to 0 for new collector
		}

		currentMoneyMotion.tween(newCurrent, {
			time: 1.5, // Shorter tween time?
			style: Enum.EasingStyle.Exponential,
		});

		// Stop motion if it reaches the target exactly or after a delay
		if (math.ceil(untrack(currentMoneyBinding)) === newCurrent) {
			currentMoneyMotion.stop();
			currentMoneyMotion.set(newCurrent); // Ensure exact value
		}
		const stopTimer = task.delay(3, () => {
			// Shorter stop delay
			currentMoneyMotion.stop();
		});

		// Cleanup timer if effect re-runs
		return () => task.cancel(stopTimer);
	});

	return (
		<frame // Main container frame
			AnchorPoint={new Vector2(1, 0)}
			Position={new UDim2(0.98, 0, 0, 0)}
			Size={new UDim2(0.2, 0, 0.1, 0)}
			BackgroundTransparency={1}
			BackgroundColor3={Color3.fromRGB(0, 0, 0)}
			BorderSizePixel={0}
		>
			<uipadding
				PaddingTop={new UDim(0, 0)}
				PaddingBottom={new UDim(0, 5)}
				PaddingLeft={new UDim(0, 10)}
				PaddingRight={new UDim(0, 10)}
			/>
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical} // Stack elements vertically
				HorizontalAlignment={Enum.HorizontalAlignment.Right} // Align text to the right
				VerticalAlignment={Enum.VerticalAlignment.Top}
				SortOrder={Enum.SortOrder.LayoutOrder}
				Padding={new UDim(0, 5)} // Padding between lines
			/>

			{/* Money Progress Frame (Horizontal Layout) */}
			<frame
				Name="MoneyProgress" // Renamed from "Goal"
				LayoutOrder={1}
				// AnchorPoint removed, let layout handle positioning
				Size={new UDim2(1, 0, 0, 35)} // Keep fixed height
				AutomaticSize={Enum.AutomaticSize.None} // Keep fixed size
				BackgroundTransparency={1} // Keep background transparent
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					HorizontalAlignment={Enum.HorizontalAlignment.Right} // Align items to the right
					VerticalAlignment={Enum.VerticalAlignment.Center}
					SortOrder={Enum.SortOrder.LayoutOrder}
					Padding={new UDim(0, 5)} // Padding between money elements
				/>

				{/* Current Money Value */}
				<TextLabel
					Name="CurrentValue"
					LayoutOrder={1}
					Text={() => `$${math.round(currentMoneyBinding())}`} // Animated value
					TextColor3={Color3.fromRGB(0, 255, 0)} // Green for current
					TextSize={30}
					TextXAlignment={Enum.TextXAlignment.Right}
					Size={UDim2.fromOffset(0, 30)} // Auto width
					AutomaticSize={Enum.AutomaticSize.X}
					BackgroundTransparency={1}
				/>

				{/* Separator */}
				<TextLabel
					Name="Separator"
					LayoutOrder={2}
					Text="/"
					TextColor3={Color3.fromRGB(150, 150, 150)} // Grey separator
					TextSize={30}
					TextXAlignment={Enum.TextXAlignment.Center}
					Size={UDim2.fromOffset(0, 30)} // Auto width
					AutomaticSize={Enum.AutomaticSize.X}
					BackgroundTransparency={1}
				/>

				{/* Goal Money Value */}
				<TextLabel
					Name="GoalValue"
					LayoutOrder={3}
					Text={() => `$${goal()}`} // Goal value (not animated)
					TextColor3={Color3.fromRGB(255, 255, 255)} // White for goal
					TextSize={30}
					TextXAlignment={Enum.TextXAlignment.Right}
					Size={UDim2.fromOffset(0, 30)} // Auto width
					AutomaticSize={Enum.AutomaticSize.X}
					BackgroundTransparency={1}
				/>
			</frame>
			<Collectors />
		</frame>
	);
}

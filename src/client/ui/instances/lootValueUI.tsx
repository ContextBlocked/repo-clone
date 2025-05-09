import Vide, { effect, source } from "@rbxts/vide"; // Removed 'source' import
import { useAtom } from "@rbxts/vide-charm";
import { lootAtom } from "../../components/core/instance/loot";
import Ripple from "@rbxts/ripple";
import { useMotion } from "@rbxts/pretty-vide-utils";
import constants from "../../../shared/constants";
// Import the new drag state atom
import { locallyDraggedLootId } from "../../store/atoms/drag-state";
import { setTimeout } from "@rbxts/set-timeout";
import { peek } from "@rbxts/charm";

type LootValueUIProps = {
	lootAtom: lootAtom;
	decrement?: boolean;
	id?: number; // Add id prop, make it optional for the temporary effect UI
};

export function LootValueUI(props: LootValueUIProps) {
	const lootValue = useAtom(() => props.lootAtom());
	const [colorBinding, colorMotion] = useMotion(Color3.fromRGB(255, 255, 255));
	const [sizeBinding, sizeMotion] = useMotion(0);
	// Get the globally dragged ID
	const isVisible = useAtom(() => {
		return props.id !== undefined ? locallyDraggedLootId() === props.id : props.decrement === true;
	});
	const visible = source(true);
	if (props.decrement) {
		sizeMotion.spring(24, { ...Ripple.config.spring.default, mass: 2, velocity: 0.6 });

		colorMotion.tween(Color3.fromRGB(255, 0, 0), {
			delayTime: 0.2,
			time: 1,
			style: Enum.EasingStyle.Elastic,
		});

		// Clean up animation for temporary effect UI
		if (props.id === undefined) {
			setTimeout(() => {
				sizeMotion.tween(0, {
					time: 0.1,
				});

				const fadeOutCompleteCleanup = sizeMotion.onComplete(() => {
					// No need to set visibility source, parent billboard will be destroyed
					if (colorMotion) colorMotion.destroy();
					if (sizeMotion) sizeMotion.destroy();
					fadeOutCompleteCleanup(); // Clean up this listener
				});
			}, 3);
		}
	}
	effect(() => {
		if (isVisible()) {
			peek(visible(true));
			if (!props.decrement) sizeMotion.tween(24, { time: 0.1 });
		} else {
			if (!props.decrement) sizeMotion.tween(0, { time: 0.1 });
			setTimeout(() => peek(visible(false)), 0.1);
		}
		if (props.decrement) print(peek(visible()));
	});

	// REMOVED the effect hook that checked lootValue().dragging

	return (
		<textlabel
			BackgroundTransparency={1}
			FontFace={constants.font}
			Size={new UDim2(0, 200, 0, 50)}
			Text={() => `$${lootValue().value}`} // Only depends on value now
			TextColor3={() => (props.decrement ? colorBinding() : Color3.fromRGB(13, 255, 0))}
			TextSize={() => math.round(sizeBinding())}
			AnchorPoint={new Vector2(0.5, 0.5)}
			Position={new UDim2(0.5, 0, 0.5, 0)}
			Visible={visible}
			// Removed Active={false}
			// Clean up motions when the component unmounts if not already destroyed
			Destroying={() => {
				if (colorMotion) colorMotion.destroy();
				if (sizeMotion) sizeMotion.destroy();
			}}
		/>
	);
}

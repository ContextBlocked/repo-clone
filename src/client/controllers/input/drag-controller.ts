import { Controller, OnStart } from "@flamework/core";
import { CollectionService, Players, Workspace } from "@rbxts/services";
import { atom, Atom } from "@rbxts/charm";
import { loot } from "../../components/core/instance/loot";
import Make from "@rbxts/make";

/**
 * @Deprecated
 */
@Controller({})
export class dragController implements OnStart {
	static playersDragging: Atom<Set<string>> = atom(new Set());
	DRAG_PLANE_OFFSET = 10;
	MAX_DRAG_DISTANCE = 100;
	raycastParams = new RaycastParams();
	visualize = Make("Part", {
		Shape: Enum.PartType.Ball,
		Size: new Vector3(0.2, 0.2, 0.2),
		Anchored: true,
		CanCollide: false,
		Transparency: 0,
		Color: new Color3(1, 0, 0),
	});

	onStart() {
		this.initializeInput();
		this.raycastParams.FilterType = Enum.RaycastFilterType.Include;
		CollectionService.GetInstanceAddedSignal("loot").Connect((instance) => {});
		this.raycastParams.FilterDescendantsInstances = CollectionService.GetTagged("loot");
	}
	initializeInput() {}
	getTargetPosition(mouseRay: Ray, character: Model) {
		const camera = Workspace.CurrentCamera!;
		const planeNormal = camera.CFrame.LookVector;
		const planePoint = camera.CFrame.Position.add(planeNormal.mul(this.DRAG_PLANE_OFFSET));

		const rayOrigin = mouseRay.Origin;
		const rayDirection = mouseRay.Direction.Unit;
		const dot = planeNormal.Dot(rayDirection);

		if (math.abs(dot) < 0.001) {
			return undefined;
		}
		const t = planeNormal.Dot(planePoint.sub(rayOrigin)) / dot;
		let worldPosition = rayOrigin.add(rayDirection.mul(t));
		//maximum distance
		const toCharacter = worldPosition.sub(character.GetPivot().Position);
		if (toCharacter.Magnitude > this.MAX_DRAG_DISTANCE) {
			worldPosition = character.GetPivot().Position.add(toCharacter.Unit.mul(this.MAX_DRAG_DISTANCE));
		}
		return worldPosition;
	}
	getMouseRay() {
		const mouse = Players.LocalPlayer.GetMouse();
		const camera = Workspace.CurrentCamera!;
		return camera.ScreenPointToRay(mouse.X, mouse.Y);
	}
	visualizeDragPosition(position: Vector3, part: Model) {
		const visualizePart = this.visualize.Clone();
		visualizePart.Position = position;
		visualizePart.Parent = part;
	}
	drag(actionName: string, inputState: Enum.UserInputState, inputObject: InputObject, character: Model) {
		return Enum.ContextActionResult.Pass;
		if (inputState === Enum.UserInputState.Begin) {
			dragController.playersDragging((prev) => {
				prev.add(Players.LocalPlayer.Name);
				return prev;
			});
			const mouseRay = this.getMouseRay();
			const raycastResult = Workspace.Raycast(mouseRay.Origin, mouseRay.Direction.mul(1000), this.raycastParams)!;
			if (raycastResult && raycastResult.Instance) {
				const dragTarget = raycastResult.Instance;
				const parent = dragTarget.Parent as Model;
				// Calculate hit position in local space
				const localHitPos = parent.PrimaryPart!.CFrame.PointToObjectSpace(raycastResult.Position);

				// Set new pivot offset
				parent.PrimaryPart!.PivotOffset = new CFrame(localHitPos);

				// Now the pivot is at the grab point
				this.visualizeDragPosition(raycastResult.Position, parent);
				//motion
				parent.AddTag("dragging");
			}
		} else if (inputState === Enum.UserInputState.End) {
			dragController.playersDragging((prev) => {
				prev.delete(Players.LocalPlayer.Name);
				return prev;
			});
		}
		return Enum.ContextActionResult.Pass;
	}
}

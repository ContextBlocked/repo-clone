import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Janitor } from "@rbxts/janitor";
import { Players, RunService, UserInputService, Workspace } from "@rbxts/services";
import { Events } from "client/network";
import { LootModel } from "types/lootModel";
import { characterSettings } from "client/store/atoms/characterSettingsAtom";
import { subscribe } from "@rbxts/charm";
import { locallyDraggedLootId } from "../../../store/atoms/drag-state";

// Constants for client-side clamping
const MIN_DRAG_DISTANCE_CLIENT = 2;
const MAX_DRAG_DISTANCE_CLIENT = 20;
const SCROLL_SENSITIVITY = 0.5;

interface DraggableAttributes {
	id: number;
	weight?: number;
}

@Component({ tag: "draggable" })
export class Draggable extends BaseComponent<DraggableAttributes, LootModel> implements OnStart {
	private janitor = new Janitor<{ updateConnection?: RBXScriptConnection; inputConnection?: RBXScriptConnection }>();
	private isLocallyDragging = false;
	private dragUpdateConnection: RBXScriptConnection | undefined;
	private currentDragDistance: number | undefined = undefined;

	onStart() {
		if (!this.instance.PrimaryPart) {
			task.delay(1, () => {
				if (!this.instance.PrimaryPart) {
					warn(`Draggable component on ${this.instance.Name} requires a PrimaryPart.`);
					// Consider waiting or erroring if PrimaryPart is essential immediately
					return;
				}
			});
		}
		this.janitor.LinkToInstance(this.instance, false);

		// --- Input Setup ---
		this.janitor.Add(
			UserInputService.InputBegan.Connect((input, gameProcessed) => {
				if (input.UserInputType === Enum.UserInputType.MouseButton1 && !gameProcessed) {
					const mouseRay = this.getMouseRay();
					if (!mouseRay) return;

					const raycastParams = new RaycastParams();
					raycastParams.FilterType = Enum.RaycastFilterType.Include;
					raycastParams.FilterDescendantsInstances = [this.instance];
					const raycastResult = Workspace.Raycast(
						mouseRay.Origin,
						mouseRay.Direction.mul(100),
						raycastParams,
					);

					if (raycastResult && raycastResult.Instance.IsDescendantOf(this.instance)) {
						this.handleDragStart(raycastResult.Position);
					}
				}
				if (input.UserInputType === Enum.UserInputType.MouseWheel && this.isLocallyDragging && !gameProcessed) {
					const delta = input.Position.Z;
					this.adjustDragDistance(-delta * SCROLL_SENSITIVITY);
				}
			}),
			"Disconnect",
			"inputConnection",
		);

		this.janitor.Add(
			subscribe(characterSettings, (state) => {
				this.currentDragDistance = math.clamp(
					state.distance ?? this.currentDragDistance ?? 10,
					MIN_DRAG_DISTANCE_CLIENT,
					MAX_DRAG_DISTANCE_CLIENT,
				);
			}),
		);

		// Listen for MouseButton1 release to stop dragging
		this.janitor.Add(
			UserInputService.InputEnded.Connect((input, _gameProcessed) => {
				// No need to check gameProcessed here, always stop drag on release
				if (input.UserInputType === Enum.UserInputType.MouseButton1 && this.isLocallyDragging) {
					this.handleDragEnd();
				}
			}),
			"Disconnect",
		);
	}

	destroy() {
		// Ensure drag is stopped if component is destroyed mid-drag
		if (this.isLocallyDragging) {
			this.handleDragEnd();
		}
		if (locallyDraggedLootId() === this.attributes.id) {
			locallyDraggedLootId(undefined);
		}
		this.janitor.Destroy();
	}

	// Added worldHitPosition parameter from the initial raycast
	private handleDragStart(worldHitPosition: Vector3) {
		if (this.isLocallyDragging || !this.instance.PrimaryPart) return;

		// Calculate Initial Distance
		const playerCharacter = Players.LocalPlayer.Character;
		const head = playerCharacter?.FindFirstChild("Head") as BasePart | undefined;
		const rootPart = playerCharacter?.PrimaryPart;
		const playerPosition = head ? head.Position : rootPart?.Position;
		const objectAttachment = this.instance.PrimaryPart?.FindFirstChild("DraggableAttachment") as
			| Attachment
			| undefined;
		const objectPosition = objectAttachment
			? objectAttachment.WorldPosition
			: this.instance.PrimaryPart?.Position ?? worldHitPosition;

		if (playerPosition) {
			const initialDistance = objectPosition.sub(playerPosition).Magnitude;
			this.currentDragDistance = math.clamp(initialDistance, MIN_DRAG_DISTANCE_CLIENT, MAX_DRAG_DISTANCE_CLIENT);
		} else {
			this.currentDragDistance = characterSettings().distance;
			warn("Could not determine player position for initial drag distance, using setting fallback.");
		}

		// Update global distance setting to match this drag's starting distance
		if (this.currentDragDistance !== undefined) {
			characterSettings((prev) => ({ ...prev, distance: this.currentDragDistance! }));
		}
		locallyDraggedLootId(this.attributes.id);
		this.isLocallyDragging = true;
		const relativeHitPosition = this.instance.PrimaryPart.CFrame.ToObjectSpace(
			new CFrame(worldHitPosition),
		).Position;
		Events.dragStart.fire(this.attributes.id, worldHitPosition, relativeHitPosition);

		this.dragUpdateConnection = RunService.RenderStepped.Connect(() => {
			if (!this.isLocallyDragging) {
				this.stopDragLoop();
				return;
			}
			const currentMouseRay = this.getMouseRay();
			if (!currentMouseRay) return;

			const distanceToSend = this.currentDragDistance ?? characterSettings().distance;
			Events.dragUpdate.fire(this.attributes.id, currentMouseRay.Direction, distanceToSend);
		});
		this.janitor.Add(this.dragUpdateConnection, "Disconnect", "updateConnection");
	}

	private adjustDragDistance(change: number) {
		if (!this.isLocallyDragging || this.currentDragDistance === undefined) {
			print("AdjustDragDistance: Not dragging or distance not set.");
			return;
		}

		const newDistance = math.clamp(
			this.currentDragDistance + change,
			MIN_DRAG_DISTANCE_CLIENT,
			MAX_DRAG_DISTANCE_CLIENT,
		);

		if (newDistance !== this.currentDragDistance) {
			this.currentDragDistance = newDistance;
			// Update global setting so future drags start from this distance
			characterSettings((prev) => ({ ...prev, distance: this.currentDragDistance! }));
		}
	}

	private stopDragLoop() {
		if (this.dragUpdateConnection) {
			if (this.janitor.Get("updateConnection")) {
				this.janitor.Remove("updateConnection");
			}
			this.dragUpdateConnection.Disconnect();
			this.dragUpdateConnection = undefined;
		}
	}

	private handleDragEnd() {
		if (!this.isLocallyDragging) return;
		if (locallyDraggedLootId() === this.attributes.id) {
			locallyDraggedLootId(undefined);
		}
		this.stopDragLoop();
		this.isLocallyDragging = false;
		this.currentDragDistance = undefined;
		Events.dragStop.fire(this.attributes.id);
	}

	/**
	 * Gets the current mouse position and converts it to a 3D world ray.
	 */
	private getMouseRay(): Ray | undefined {
		const camera = Workspace.CurrentCamera;
		if (!camera) return undefined;
		const mousePos = UserInputService.GetMouseLocation();
		// UserInputService.GetMouseLocation() provides coordinates relative to the viewport top-left.
		// Use ViewportPointToRay directly with these coordinates.
		return camera.ViewportPointToRay(mousePos.X, mousePos.Y);
	}
}

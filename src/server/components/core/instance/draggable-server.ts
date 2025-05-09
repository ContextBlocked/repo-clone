import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Janitor } from "@rbxts/janitor";
import { Players, Workspace } from "@rbxts/services";
import { Events } from "server/network";
import { LootModel } from "types/lootModel";
import Object from "@rbxts/object-utils";
import Make from "@rbxts/make"; // Use a more generic Model type if needed

// Interface for attributes expected on a draggable instance on the server
interface DraggableServerAttributes {
	id: number;
	weight?: number; // Example: Add weight attribute
	// Add other physics properties as needed (e.g., centerOfMassOffset)
}

// Structure to hold information about a player currently dragging this object
interface DraggerInfo {
	player: Player;
	relativeHitPosition: Vector3;
	targetAttachmentWorldPosition: Vector3;
	mouseRayDirection: Vector3;
	desiredDistance: number; // Last known distance from client update
	initialRelativeOrientation?: CFrame;
}

@Component({ tag: "draggable" })
export class DraggableServer extends BaseComponent<DraggableServerAttributes, LootModel> implements OnStart {
	private janitor = new Janitor();
	private physicsJanitor = new Janitor(); // Separate janitor for physics constraints if needed
	private activeDraggers = new Map<Player, DraggerInfo>();

	// Physics related properties (examples, adjust as needed)
	private alignPosition: AlignPosition | undefined;
	private alignOrientation: AlignOrientation | undefined;
	private attachment0: Attachment | undefined; // Attachment on the dragged object
	private attachment1: Attachment | undefined; // Attachment for the target position (might not be needed if setting CFrame directly)

	private readonly BASE_RESPONSIVENESS = 50; // Example base responsiveness
	private readonly BASE_MAX_FORCE = 10000; // Example base force
	private readonly MAX_DRAG_DISTANCE = 20; // Maximum distance player can drag object from their head

	onStart() {
		if (!this.instance.PrimaryPart) {
			warn(`DraggableServer component on ${this.instance.Name} requires a PrimaryPart.`);
			// Consider waiting or erroring if PrimaryPart is essential immediately
			return;
		}
		this.janitor.LinkToInstance(this.instance, false); // Link instance lifetime

		// --- Network Event Listeners ---
		this.janitor.Add(
			Events.dragStart.connect((player, targetId, worldHit, relativeHit) => {
				if (targetId === this.attributes.id) {
					this.handleDragStart(player, worldHit, relativeHit);
				}
			}),
			"Disconnect",
		);

		this.janitor.Add(
			Events.dragUpdate.connect((player, targetId, rayDir, distance) => {
				if (targetId === this.attributes.id) {
					this.handleDragUpdate(player, rayDir, distance);
				}
			}),
			"Disconnect",
		);

		this.janitor.Add(
			Events.dragStop.connect((player, targetId) => {
				if (targetId === this.attributes.id) {
					this.handleDragStop(player);
				}
			}),
			"Disconnect",
		);

		// --- Player Removal Listener ---
		this.janitor.Add(
			Players.PlayerRemoving.Connect((player) => {
				if (this.activeDraggers.has(player)) {
					this.handleDragStop(player); // Ensure cleanup if player leaves mid-drag
				}
			}),
			"Disconnect",
		);

		// --- Initial Physics Setup ---
		this.setupPhysics();
	}

	destroy() {
		// Ensure physics constraints are cleaned up when component is destroyed
		this.physicsJanitor.Cleanup();
		this.janitor.Destroy();
		// Stop any active drags associated with this instance
		this.activeDraggers.forEach((info, player) => {
			// Maybe notify client? For now, just clean up server state.
		});
		this.activeDraggers.clear();
	}

	private setupPhysics() {
		this.physicsJanitor.Cleanup();

		const primaryPart = this.instance.PrimaryPart!;

		// Attachment on the object (at the click point)
		this.attachment0 = primaryPart.FindFirstChild("DraggableAttachment") as Attachment;
		if (!this.attachment0) {
			this.attachment0 = new Instance("Attachment", primaryPart);
			this.attachment0.Name = "DraggableAttachment";
			this.attachment0.Visible = true; // Keep visible for debugging initially
		}
		this.physicsJanitor.Add(this.attachment0);

		// Attachment representing the target world position/orientation
		this.attachment1 = Make("Attachment", {
			Parent: Workspace.Terrain,
		});
		this.attachment1.Name = "DraggableTargetAttachment";
		this.attachment1.Visible = true; // Keep visible for debugging initially
		this.physicsJanitor.Add(this.attachment1);

		// AlignPosition Constraint - Now uses two attachments
		this.alignPosition = new Instance("AlignPosition", primaryPart);
		this.alignPosition.Attachment0 = this.attachment0; // Point on the object
		this.alignPosition.Attachment1 = this.attachment1; // Target point in the world
		this.alignPosition.Mode = Enum.PositionAlignmentMode.TwoAttachment;
		this.alignPosition.Responsiveness = this.BASE_RESPONSIVENESS;
		this.alignPosition.MaxForce = this.BASE_MAX_FORCE;
		this.alignPosition.Enabled = false;
		this.physicsJanitor.Add(this.alignPosition);

		// AlignOrientation Constraint - Now uses two attachments
		this.alignOrientation = new Instance("AlignOrientation", primaryPart);
		this.alignOrientation.Attachment0 = this.attachment0; // Point on the object
		this.alignOrientation.Attachment1 = this.attachment1; // Target point in the world
		this.alignOrientation.Mode = Enum.OrientationAlignmentMode.TwoAttachment;
		this.alignOrientation.Responsiveness = this.BASE_RESPONSIVENESS;
		this.alignOrientation.MaxTorque = this.BASE_MAX_FORCE;
		this.alignOrientation.Enabled = false;
		this.physicsJanitor.Add(this.alignOrientation);
	}

	private handleDragStart(player: Player, worldHit: Vector3, relativeHit: Vector3) {
		// --- Max Distance Check ---
		const playerCharacter = player.Character;
		const head = playerCharacter?.FindFirstChild("Head") as BasePart | undefined;
		const rootPart = playerCharacter?.PrimaryPart;

		if (!head && !rootPart) {
			warn(`Cannot determine player position for distance check for ${player.Name}. Aborting drag.`);
			return;
		}
		const playerPosition = head ? head.Position : rootPart!.Position;
		const objectAttachment = this.instance.PrimaryPart?.FindFirstChild("DraggableAttachment") as
			| Attachment
			| undefined;
		const checkPosition = objectAttachment
			? objectAttachment.WorldPosition
			: this.instance.PrimaryPart?.Position ?? worldHit;
		const initialActualDistance = checkPosition.sub(playerPosition).Magnitude;

		if (initialActualDistance > this.MAX_DRAG_DISTANCE) {
			return;
		}
		// --- End of Max Distance Check ---

		if (!this.activeDraggers.has(player)) {
			// Ensure attachments exist before proceeding
			if (!this.attachment0 || !this.attachment1 || !this.alignPosition || !this.alignOrientation) {
				warn(
					`Physics attachments/constraints missing for ${this.instance.Name} during drag start. Setup might have failed.`,
				);
				return;
			}
			// Set the object's attachment position based on the relative hit from the client
			this.attachment0.Position = relativeHit;

			// --- Calculate Initial Target based on Current State ---
			let initialTargetAttachmentWorldCFrame: CFrame;
			let initialRelativeOrientation: CFrame | undefined = undefined;
			let initialDesiredDistance = initialActualDistance; // Start with the checked distance

			const currentObjectAttachmentWorldCFrame = this.attachment0.WorldCFrame; // Get object attachment's current world CFrame

			if (head) {
				const currentHeadCFrame = head.CFrame;
				// Calculate object's current orientation relative to the head
				initialRelativeOrientation = currentHeadCFrame.ToObjectSpace(
					currentObjectAttachmentWorldCFrame,
				).Rotation;

				// Calculate the actual current distance and clamp it
				const currentDistance = currentObjectAttachmentWorldCFrame.Position.sub(
					currentHeadCFrame.Position,
				).Magnitude;
				initialDesiredDistance = math.min(currentDistance, this.MAX_DRAG_DISTANCE); // Use current distance, clamped

				// Calculate the initial target position based on head, direction, and clamped current distance
				const direction = currentObjectAttachmentWorldCFrame.Position.sub(currentHeadCFrame.Position).Unit;
				const targetPosition = currentHeadCFrame.Position.add(direction.mul(initialDesiredDistance));

				// Calculate the initial target orientation
				const targetOrientation = currentHeadCFrame.mul(initialRelativeOrientation);

				// Combine into the initial target CFrame for attachment1
				initialTargetAttachmentWorldCFrame = targetOrientation.add(
					targetPosition.sub(targetOrientation.Position),
				);
			} else {
				// Fallback if head is not found (less accurate orientation)
				warn(
					`Could not find Head for player ${player.Name} during drag start. Using fallback orientation/distance.`,
				);
				// Use the object's current world position as the target position
				initialTargetAttachmentWorldCFrame = currentObjectAttachmentWorldCFrame;
				// Recalculate distance based on rootPart if head wasn't found
				if (rootPart) {
					const currentDistance = currentObjectAttachmentWorldCFrame.Position.sub(
						rootPart.Position,
					).Magnitude;
					initialDesiredDistance = math.min(currentDistance, this.MAX_DRAG_DISTANCE);
				} else {
					initialDesiredDistance = math.min(initialDesiredDistance, this.MAX_DRAG_DISTANCE); // Fallback to original check distance
				}
			}

			// Set the initial WorldCFrame for the target attachment (attachment1)
			this.attachment1.WorldCFrame = initialTargetAttachmentWorldCFrame;
			// --- End of Initial Target Calculation ---

			const draggerInfo: DraggerInfo = {
				player: player,
				relativeHitPosition: relativeHit, // Still store the client's relative hit for reference if needed
				targetAttachmentWorldPosition: initialTargetAttachmentWorldCFrame.Position, // Store the calculated initial target position
				mouseRayDirection: head ? head.CFrame.LookVector : new Vector3(0, 0, -1), // Initial direction
				desiredDistance: initialDesiredDistance, // Store the calculated and clamped initial distance
				initialRelativeOrientation: initialRelativeOrientation, // Store the calculated initial relative orientation
			};
			this.activeDraggers.set(player, draggerInfo);

			// Transfer network ownership
			if (this.instance.PrimaryPart) {
				this.instance.PrimaryPart.SetNetworkOwner(player);
			}

			// Enable constraints *after* setting the initial target CFrame
			if (this.activeDraggers.size() === 1) {
				if (this.alignPosition) this.alignPosition.Enabled = true;
				if (this.alignOrientation) this.alignOrientation.Enabled = true;
			}
		}
	}

	private handleDragUpdate(player: Player, rayDir: Vector3, desiredDistance: number) {
		const draggerInfo = this.activeDraggers.get(player);
		if (draggerInfo) {
			// Clamp the distance received from the client
			const distanceToUse = math.min(desiredDistance, this.MAX_DRAG_DISTANCE);
			draggerInfo.desiredDistance = distanceToUse;

			// Calculate Target Attachment World Position
			const playerCharacter = player.Character;
			const head = playerCharacter?.FindFirstChild("Head") as BasePart | undefined;
			if (head) {
				const headPosition = head.Position;
				draggerInfo.targetAttachmentWorldPosition = headPosition.add(rayDir.Unit.mul(distanceToUse));
				draggerInfo.mouseRayDirection = rayDir;
			} else {
				warn(`Cannot find Head for player ${player.Name} during drag update.`);
				return;
			}

			this.updateTargetCFrame();
		}
	}

	private handleDragStop(player: Player) {
		if (this.activeDraggers.has(player)) {
			this.activeDraggers.delete(player);

			if (this.activeDraggers.size() === 0) {
				// Last dragger stopped
				if (this.alignPosition) this.alignPosition.Enabled = false;
				if (this.alignOrientation) this.alignOrientation.Enabled = false;
				// Constraints remain but are disabled
				// Delay returning network ownership to auto
				const ownershipDelay = 0.5; // Delay in seconds (tune as needed)
				task.delay(ownershipDelay, () => {
					// Check if the instance and primary part still exist after the delay
					if (this.instance?.PrimaryPart && this.instance.PrimaryPart.IsDescendantOf(Workspace)) {
						// Only set ownership back to auto if no other player started dragging
						// during the delay.
						if (this.activeDraggers.size() === 0) {
							this.instance.PrimaryPart.SetNetworkOwnershipAuto();
						}
					}
				});
			} else {
				// Other players still dragging, just recalculate target
				this.updateTargetCFrame();
			}
		}
	}

	/**
	 * Calculates and updates the target CFrame for the physics constraints
	 * based on the average input of all active draggers.
	 */
	private updateTargetCFrame() {
		if (this.activeDraggers.size() === 0 || !this.instance.PrimaryPart || !this.attachment1) {
			return;
		}
		// Ensure physics constraints exist and are enabled
		if (!this.alignPosition || !this.alignOrientation) {
			warn(`updateTargetCFrame called but constraints are missing for ${this.instance.Name}`);
			return;
		}
		if (!this.alignPosition.Enabled) this.alignPosition.Enabled = true;
		if (!this.alignOrientation.Enabled) this.alignOrientation.Enabled = true;

		// Get Target Info (Using first dragger for now)
		const firstDragger = Object.values(this.activeDraggers)[0];
		if (!firstDragger) return;

		const targetAttachmentWorldPos = firstDragger.targetAttachmentWorldPosition;

		// Calculate Target Orientation (Requires head)
		let targetOrientationCFrame = CFrame.identity;
		const playerCharacter = firstDragger.player.Character;
		const head = playerCharacter?.FindFirstChild("Head") as BasePart | undefined;

		if (head && firstDragger.initialRelativeOrientation) {
			const currentHeadCFrame = head.CFrame;
			targetOrientationCFrame = currentHeadCFrame.mul(firstDragger.initialRelativeOrientation);
		} else if (!head) {
			warn(`Cannot find Head for player ${firstDragger.player.Name} to calculate drag orientation.`);
			targetOrientationCFrame = this.attachment1.WorldCFrame.Rotation;
		} else {
			targetOrientationCFrame = this.attachment1.WorldCFrame.Rotation;
		}

		// Update Target Attachment (attachment1)
		this.attachment1.WorldCFrame = targetOrientationCFrame.add(
			targetAttachmentWorldPos.sub(targetOrientationCFrame.Position),
		);

		// Adjust Physics Parameters
		const weight = this.attributes.weight ?? 1;
		const responsivenessFactor = math.clamp(1 / weight, 0.1, 1);
		const forceFactor = math.clamp(weight, 1, 10);

		if (this.alignPosition) {
			this.alignPosition.Responsiveness = this.BASE_RESPONSIVENESS * responsivenessFactor;
			this.alignPosition.MaxForce = this.BASE_MAX_FORCE * forceFactor;
		}
		if (this.alignOrientation) {
			this.alignOrientation.Responsiveness = this.BASE_RESPONSIVENESS * responsivenessFactor;
			this.alignOrientation.MaxTorque = this.BASE_MAX_FORCE * forceFactor;
		}
	}
}

import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Events } from "../../../network";
import { Janitor } from "@rbxts/janitor";
import { Atom, atom, subscribe } from "@rbxts/charm";
import { Lighting, Players, Workspace } from "@rbxts/services";
import { Loot, LootAttributes, LootModel } from "types/lootModel";
import Vide, { mount } from "@rbxts/vide";
import { LootValueUI } from "../../../ui/instances/lootValueUI";
import { lootValues } from "shared/constants/lootValues";
import { usePx } from "../../../ui/hooks/usepx";
import Make from "@rbxts/make";
import { isPlayerNearby } from "shared/utils/isPlayerNearby";
import { shakeCamera } from "shared/utils/shakeCamera";

// Atom now only manages the value, dragging is handled by Draggable component
export type lootAtom = Atom<{ value: number }>;

/**
 * Loot component class that handles the value, collision, and destruction logic of loot instances.
 * Dragging is handled by the separate 'Draggable' component.
 * Implements the OnStart interface to initialize the component on start.
 */
@Component({ tag: "loot" })
export class loot extends BaseComponent<LootAttributes, LootModel> implements OnStart {
	janitor = new Janitor();
	lootAtom = atom({
		value: this.attributes.value ?? lootValues[this.instance.Name as keyof Loot]?.value ?? 0,
	});

	/**
	 * Timestamp of the last collision for debouncing
	 */
	public lastCollisionTime = os.clock(); // Made public for potential access by LootDrag if needed

	/**
	 * Minimum force required to count as a significant collision
	 */
	private MIN_IMPACT_FORCE = 15;

	/**
	 * Time in seconds between processing collisions
	 */
	private COOLDOWN_TIME = 0.5;

	/**
	 * Percentage of value reduction per impact
	 */
	private VALUE_REDUCTION_FACTOR = 0.3;

	/**
	 * Minimum value reduction amount per collision
	 */
	private VALUE_REDUCTION_MIN = 5;

	/**
	 * Initializes the component on start.
	 */
	onStart() {
		// Ensure PrimaryPart exists before proceeding
		if (!this.instance.PrimaryPart) {
			this.instance.GetPropertyChangedSignal("PrimaryPart").Wait();
		}

		this.janitor.LinkToInstance(this.instance, false);

		this.setupCollisionDetection(); // Keep collision setup

		// Mount the UI - Pass the loot ID
		this.janitor.Add(mount(() => valueUi(this.lootAtom, this.attributes.id), this.instance));

		// Subscribe to value changes for destruction logic
		this.janitor.Add(
			subscribe(this.lootAtom, (state) => {
				if (state.value <= 0) {
					this.destroyLootWithDebris();
				}
			}),
		);
	}

	destroy() {
		this.janitor.Destroy();
	}

	/**
	 * Sets up collision detection for the loot instance.
	 */
	private setupCollisionDetection() {
		// Listen for collisions on the primary part
		if (!this.instance.PrimaryPart) return; // Guard against missing primary part

		this.janitor.Add(
			this.instance.PrimaryPart.Touched.Connect((otherPart) => {
				this.handleCollision(otherPart);
			}),
			"Disconnect",
		);
	}

	/**
	 * Handles collision events between this loot and other parts
	 * @param otherPart - The part that collided with this loot
	 */
	private handleCollision(otherPart: BasePart) {
		// Ignore collisions with player character
		const player = Players.LocalPlayer;
		if (player.Character && otherPart.IsDescendantOf(player.Character)) {
			return;
		}

		// Debounce to prevent multiple reductions
		const currentTime = os.clock();
		if (currentTime - this.lastCollisionTime < this.COOLDOWN_TIME) {
			return;
		}

		const primaryPart = this.instance.PrimaryPart!;
		const relativeVelocity = primaryPart.AssemblyLinearVelocity.sub(
			otherPart.AssemblyLinearVelocity || new Vector3(),
		);
		const impactForce = relativeVelocity.Magnitude;

		// Only reduce value for significant impacts
		if (impactForce < this.MIN_IMPACT_FORCE) {
			return;
		}
		// Calculate value reduction based on impact force
		const originalValue = lootValues[this.instance.Name].value ?? 0;
		const reductionFactor = math.clamp(impactForce / 50, 0.5, 3);
		const reductionAmount = math.max(
			this.VALUE_REDUCTION_MIN,
			math.floor(originalValue * this.VALUE_REDUCTION_FACTOR * reductionFactor),
		);

		const newValue = math.max(0, this.lootAtom().value - reductionAmount);

		this.lastCollisionTime = currentTime;

		const valueLost = this.lootAtom().value - newValue;

		// Update the atom first
		this.lootAtom((prev) => ({
			...prev,
			value: newValue, // Only value needs updating
		}));

		// Visual feedback for significant collisions
		this.showCollisionEffect(impactForce, valueLost); // Pass the calculated loss

		// Fire the event *after* updating the local state
		Events.reportCollision.fire(this.attributes.id, newValue);
	}

	/**
	 * Creates a visual effect at the collision point
	 * @param impactForce - The magnitude of impact force
	 * @param loss - The amount of value lost
	 */
	private showCollisionEffect(impactForce: number, loss: number) {
		const effect = new Instance("Part");
		effect.Size = new Vector3(0.5, 0.5, 0.5);
		effect.Position = this.instance.PrimaryPart!.Position;
		effect.Anchored = true;
		effect.CanCollide = false;
		effect.Transparency = 1;
		effect.Parent = Workspace;

		// Create a temporary atom for the UI effect, only needing 'value'
		const effectLootAtom = atom({
			value: loss,
		});

		// Ensure valueUi function is correctly referenced and called
		// The temporary effect UI doesn't need an ID as it's not tied to drag state
		const ui = mount(() => valueUi(effectLootAtom, undefined, true), effect); // Pass decrement=true

		// Fade out and destroy
		task.delay(3.5, () => {
			effect.Destroy();
			ui();
		});
	}

	/**
	 * Destroys the loot item and creates debris particles
	 */
	private destroyLootWithDebris() {
		// Store position before destroying
		const position = this.instance.GetPivot().Position;
		const size = this.instance.PrimaryPart?.Size ?? new Vector3(1, 1, 1); // Handle potential nil PrimaryPart
		this.instance.Parent = Lighting; // Move to Lighting to hide

		// Disable DragDetector if it exists (it should be on the instance)
		const dragDetector = this.instance.FindFirstChildWhichIsA("DragDetector");
		if (dragDetector) {
			dragDetector.Enabled = false;
		}

		// Create debris particles
		const debrisCount = math.random(15, 30);
		const debris: BasePart[] = [];
		const smoke = Make("ParticleEmitter", {
			Color: new ColorSequence(Color3.fromRGB(86, 86, 86)),
			Size: new NumberSequence([
				new NumberSequenceKeypoint(0, 2),
				new NumberSequenceKeypoint(0.1, 3.5),
				new NumberSequenceKeypoint(0.6, 3.5),
				new NumberSequenceKeypoint(1, 0),
			]),
			FlipbookLayout: Enum.ParticleFlipbookLayout.Grid8x8,
			FlipbookMode: Enum.ParticleFlipbookMode.OneShot,
			SpreadAngle: new Vector2(5, 5),
			Speed: new NumberRange(0, 0),
			Rotation: new NumberRange(50, 50),
			Lifetime: new NumberRange(5, 5),
			Texture: "rbxassetid://108586460213996",
			Enabled: false,
			Transparency: new NumberSequence(0.6, 0.6),
			ZOffset: 1,
		});
		const sparks = Make("ParticleEmitter", {
			Color: new ColorSequence(Color3.fromRGB(255, 0, 0)),
			Size: new NumberSequence([
				new NumberSequenceKeypoint(0, 0),
				new NumberSequenceKeypoint(0.5, 0.15),
				new NumberSequenceKeypoint(1, 0),
			]),
			SpreadAngle: new Vector2(90, 90),
			Speed: new NumberRange(3, 3),
			Rotation: new NumberRange(0, 0),
			Lifetime: new NumberRange(1.5, 1.5),
			Texture: "rbxasset://textures/particles/sparkles_main.dds",
			Enabled: false,
		});
		const explosion = Make("Explosion", {
			DestroyJointRadiusPercent: 0,
			BlastPressure: 0,
			Position: position,
		});
		const smokeEmitter = Make("Part", {
			Transparency: 1,
			Position: position,
			Parent: Workspace,
			Size: size,
			CanCollide: false,
			Anchored: true,
		});
		// explosion.Parent = smokeEmitter; // Explosion seems unused currently
		smoke.Parent = smokeEmitter;
		smoke.Emit(25);
		sparks.Parent = smokeEmitter;

		// Check proximity using PrimaryPart if it exists
		if (this.instance.PrimaryPart && isPlayerNearby(Players.LocalPlayer, this.instance.PrimaryPart, 20)) {
			shakeCamera(1, 1).catch(warn);
		}
		task.delay(0.1, () => sparks.Emit(10));

		const primaryPartMaterial = this.instance.PrimaryPart?.Material ?? Enum.Material.Plastic;
		const primaryPartColor = this.instance.PrimaryPart?.Color ?? Color3.fromRGB(128, 128, 128);
		const primaryPartTransparency = this.instance.PrimaryPart?.Transparency ?? 0;
		const primaryPartReflectance = this.instance.PrimaryPart?.Reflectance ?? 0;

		for (let i = 0; i < debrisCount; i++) {
			const debrisPart = Make("Part", {
				Size: new Vector3(
					(size.X / 2) * math.random(0.5, 1),
					(size.Y / 2) * math.random(0.5, 1),
					(size.Z / 2) * math.random(0.5, 1),
				),
				Position: position.add(
					new Vector3(
						(math.random(-1, 1) * size.X) / 3,
						(math.random(-1, 1) * size.Y) / 3,
						(math.random(-1, 1) * size.Z) / 3,
					),
				),
				Material: primaryPartMaterial,
				Color: primaryPartColor,
				Transparency: primaryPartTransparency,
				Reflectance: primaryPartReflectance,
				Anchored: false,
				CanCollide: true,
				CollisionGroup: "Debris",
				Parent: Workspace,
				CustomPhysicalProperties: new PhysicalProperties(1, 0.3, 0.7, 1, 1),
			});
			debris.push(debrisPart);

			const randomDir = new Vector3(math.random(-5, 5), math.random(1, 5), math.random(-5, 5)).Unit; // Bias upward
			const impulseStrength = math.random(20, 40); // Adjusted range
			debrisPart.ApplyImpulse(randomDir.mul(impulseStrength * debrisPart.AssemblyMass)); // Use AssemblyMass

			// Make debris glow briefly
			debrisPart.Material = Enum.Material.Neon;
			task.delay(0.2, () => {
				if (debrisPart.IsDescendantOf(Workspace)) {
					// Check if still exists
					debrisPart.Material = primaryPartMaterial;
				}
			});
		}

		// Clean up debris and the original instance after a delay
		task.delay(5, () => {
			// Increased delay
			for (const part of debris) {
				part.Destroy();
			}
			smokeEmitter.Destroy();
			this.instance.Destroy(); // Destroy the original instance model
		});
	}
}

function valueUi(lootAtom: lootAtom, id?: number, decrement?: boolean) {
	usePx();
	return (
		<billboardgui
			AlwaysOnTop={true}
			ClipsDescendants={true}
			LightInfluence={1}
			Size={new UDim2(0, 200, 0, 50)}
			ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
			// Set Enabled based on whether an ID was provided (temporary effects won't have one)
			Enabled={decrement || id !== undefined}
		>
			<LootValueUI decrement={decrement} lootAtom={lootAtom} id={id} />
		</billboardgui>
	);
}

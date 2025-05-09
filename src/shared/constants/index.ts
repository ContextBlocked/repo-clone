import { BaseMovement, DerivedPlayerMovement, PlayerMovement } from "shared/store/atoms/character/movementAtom";
import { RunService, ServerStorage } from "@rbxts/services";
import { StarterCharacter } from "../../types/character/starter_character";

type Bindables = PlayerMovement;
const KEYBINDS: Record<PlayerMovement, Enum.KeyCode | undefined> = {
	[BaseMovement.Walk]: Enum.KeyCode.W,
	[DerivedPlayerMovement.Crouch]: Enum.KeyCode.C,
	[BaseMovement.Sprint]: Enum.KeyCode.LeftShift,
	[BaseMovement.Idle]: undefined,
	[DerivedPlayerMovement.Jump]: Enum.KeyCode.Space,
	[DerivedPlayerMovement.Ragdoll]: Enum.KeyCode.Q,
};
const humanoidStats: Record<Uppercase<PlayerMovement>, number> = {
	WALK: 1,
	CROUCH: 0.5,
	SPRINT: 1.5,
	JUMP: 1,
	IDLE: 1,
	RAGDOLL: 0,
};
const sizes = {
	CHARACTER_CROUCH_SCALE: 0.35,
	CHARACTER_SCALE: 0.7,
	CHARACTER_HIDE_SCALE: 0.15,
};
export default {
	stamina: {
		REGEN_DELAY: 3,
		RATE_LIMIT: 0.25,
		DECREMENT_AMOUNT: 1,
	},
	humanoidStats: humanoidStats,
	font: new Font("rbxasset://fonts/families/Michroma.json", Enum.FontWeight.Bold, Enum.FontStyle.Normal),
	sizes,
	walkspeed: 16 * sizes.CHARACTER_SCALE,
	KEYBINDS,
	camera: {
		FOV: 50,
	},
	characterModel: RunService.IsServer()
		? (ServerStorage.WaitForChild("StarterCharacter") as StarterCharacter)
		: undefined,
};

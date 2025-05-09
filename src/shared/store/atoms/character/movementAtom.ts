/**
 * Enum representing basic movement states.
 */

export enum BaseMovement {
	Idle = "Idle",
	Walk = "Walk",
	Sprint = "Sprint",
}
export enum DerivedPlayerMovement {
	Crouch = "Crouch",
	Ragdoll = "Ragdoll",
	Jump = "Jump",
}
export enum CombinedPlayerMovement {
	Slide = "Slide",
	CrouchWalk = "CrouchWalk",
}
export type PlayerMovement = BaseMovement | DerivedPlayerMovement;
export type ExtendedPlayerMovement = PlayerMovement | CombinedPlayerMovement;

/**
 * Enum representing derived movement states.
 */

/**
 * Type alias for movement enums, combining both flat and derived movements.
 */
export type MovementEnum = BaseMovement | ExtendedPlayerMovement;

/**
 * Type alias for movement keys, representing the keys of both flat and derived movements.
 */
export type Movement = keyof typeof BaseMovement | keyof typeof DerivedPlayerMovement;

/**
 * A record mapping each flat movement to its opposite movement.
 */
export const OPPOSITE_MOVEMENT: Record<PlayerMovement, PlayerMovement> = {
	[BaseMovement.Idle]: BaseMovement.Walk,
	[BaseMovement.Walk]: BaseMovement.Idle,
	[BaseMovement.Sprint]: BaseMovement.Walk,
	[DerivedPlayerMovement.Crouch]: BaseMovement.Idle,
	[DerivedPlayerMovement.Jump]: BaseMovement.Idle,
	[DerivedPlayerMovement.Ragdoll]: BaseMovement.Idle,
};

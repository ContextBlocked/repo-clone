import { MovementEnum } from "shared/store/atoms/character/movementAtom";

/**
 * Represents a statistical value with maximum, current, and regeneration rates.
 */
export interface IStat {
	/** The maximum value of the stat. */
	max: number;
	/** The current value of the stat. */
	current: number;
	/** The regeneration rate of the stat. */
	regen: number;
}

/**
 * Represents dual values for a stat, such as normal and boosted states.
 */
export interface Dual {
	/** The normal value of the stat. */
	normal: number;
	/** The boosted value of the stat. */
	boosted: number;
}

/**
 * Represents humanoid-specific statistics such as movement capabilities.
 */
export interface HumanoidStats {
	/** The speed at which the humanoid can walk. */
	walkSpeed: number;
	/** The height the humanoid can jump. */
	jumpHeight: number;
}

interface ExtraCharacterStats {
	movementState: MovementEnum;

	dragging: boolean;
}

/**
 * Represents the character's statistics including health, stamina, speed, and movement state.
 */
export interface CharacterStats extends ExtraCharacterStats {
	/** The health of the character. */
	health: IStat;
	/** The stamina of the character. */
	stamina: IStat;
	/** The speed of the character in normal and boosted states. */
	speed: Dual;
	/** The current movement state of the character. */
}

/**
 * Represents the keys of the CharacterStats interface.
 */
export type StatType = keyof CharacterStats;

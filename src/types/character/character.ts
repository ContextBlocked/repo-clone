import { CharacterType } from "shared/constants/defaultCharacter";
import { CharacterStats } from "./stats";
import { MovementEnum } from "../../shared/store/atoms/character/movementAtom";

export type CharacterAnimations = Record<MovementEnum, AnimationTrack>;
/**
 * Represents a character in the game.
 */
export interface Character {
	/**
	 * Unique identifier for the character.
	 */
	id: number;

	/**
	 * Name of the character.
	 */
	name: string;

	/**
	 * Type of the character, defined by the CharacterType enum.
	 */
	characterType: CharacterType;

	/**
	 * Statistical attributes of the character, encapsulated in the CharacterStats interface.
	 */
	stats: CharacterStats;

	/**
	 * Animation settings for the character, allowing partial definitions.
	 */
	animations: Partial<CharacterAnimations>;
}

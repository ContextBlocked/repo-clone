/**
 * This module defines the default character statistics and types used in the game.
 * It exports an enum for character types and a default character stats object.
 *
 * @module defaultCharacter
 */

import { CharacterStats } from "../../types/character/stats";
import constants from "./index";
import { BaseMovement } from "../store/atoms/character/movementAtom";

/**
 * Enum representing the different types of characters in the game.
 *
 * @enum {number}
 * @readonly
 */
export enum CharacterType {
	/** Represents a player character. */
	Player,
	/** Represents a non-player character (NPC). */
	Mob,
}

/**
 * Default character statistics that satisfy the CharacterStats interface.
 *
 * @type {CharacterStats}
 * @constant
 */
export default {
	health: {
		/** Maximum health points of the character. */
		max: 100,
		/** Current health points of the character. */
		current: 100,
		/** Health regeneration rate per second. */
		regen: 0
	},
	stamina: {
		/** Maximum stamina points of the character. */
		max: 40,
		/** Current stamina points of the character. */
		current: 40,
		/** Stamina regeneration rate per second. */
		regen: 0.5
	},
	speed: {
		/** Speed of the character when boosted. */
		boosted: constants.humanoidStats.SPRINT,
		/** Normal speed of the character. */
		normal: constants.humanoidStats.WALK
	},
	/** Current movement state of the character. */
	movementState: BaseMovement.Idle,
	dragging: false,
} satisfies CharacterStats;

export enum Stat {
	/** The character's health. */
	health = "health",
	/** The character's stamina. */
	stamina = "stamina",
	/** The character's speed. */
	speed = "speed",
}
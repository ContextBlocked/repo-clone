import { CharacterStats } from "types/character/stats";
import constants from "../../../../constants";
import { BaseMovement, DerivedPlayerMovement, PlayerMovement } from "../../../../store/atoms/character/movementAtom";

/**
 * Calculates the speed of a player based on their movement state and optional speed modifiers.
 *
 * @param {PlayerMovement} state - The current movement state of the player, which can be a base or derived movement type.
 * @param {CharacterStats["speed"]} [speed] - Optional speed statistics that may include boosted and normal speed values.
 * @returns {number} The calculated speed of the player based on the movement state and speed modifiers.
 */
export function calculateSpeed(state: PlayerMovement, speed?: CharacterStats["speed"]): number {
	switch (state) {
		case BaseMovement.Sprint:
			return constants.walkspeed * (speed?.boosted ?? 1);
		case DerivedPlayerMovement.Crouch:
			return (
				constants.walkspeed *
				(speed ? speed?.normal - constants.humanoidStats.CROUCH : constants.humanoidStats.CROUCH)
			);
		default:
			return constants.walkspeed * (speed?.normal ?? 1);
	}
}

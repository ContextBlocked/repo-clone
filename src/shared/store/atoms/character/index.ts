import { atom } from "@rbxts/charm";
import { Character } from "types/character/character";
import { t } from "@rbxts/t";
import { CharacterType } from "../../../constants/defaultCharacter";

/**
 * Represents the state of characters, where each key is a string (character identifier)
 * and the value is a `Character` object.
 */
export type characterState = {
	[k in string]?: Character;
};

/**
 * Validates an object with two properties:
 * - `normal`: A positive number representing the normal state.
 * - `boosted`: A positive number representing the boosted state.
 */
const checkIDual = t.interface({
	normal: t.numberPositive,
	boosted: t.numberPositive,
});

/**
 * Validates an object with three properties:
 * - `max`: A positive number representing the maximum value.
 * - `regen`: A positive number representing the regeneration value.
 * - `current`: A positive number representing the current value.
 */
const checkIStat = t.interface({
	max: t.numberPositive,
	regen: t.numberPositive,
	current: t.numberPositive,
});

/**
 * Validates the structure of a character object.
 * @param player - The identifier for the player.
 */
const check = (player: string) =>
	t.interface({
		[player]: t.interface({
			id: t.numberPositive,
			name: t.string,
			stats: t.interface({
				health: checkIDual,
				stamina: checkIStat,
				speed: checkIDual,
				movementState: t.string,
			}),
			animations: t.any,
			characterType: t.literal(CharacterType.Mob ?? CharacterType.Player),
		}),
	});

/**
 * Atom representing the state of all players, initialized as an empty object.
 */
export const characterState = {
	players: atom<characterState>({}),
};

/**
 * Loads a new character into the state for the specified player.
 * @param character - The identifier for the character.
 * @param newCharacter - The new character data to load.
 * @returns The loaded character.
 */
export function loadCharacter(character: string, newCharacter: Character) {
	return characterState.players((state) => ({
		...state,
		[character]: newCharacter,
	}))[character];
}

/**
 * Clears the character data for the specified player.
 * @param character - The identifier for the character to clear.
 * @returns The cleared character.
 */
export function clearCharacter(character: string) {
	return characterState.players(
		(state) =>
			({
				...state,
				[character]: undefined,
			} as characterState),
	)[character];
}

/**
 * Updates the character data for the specified player with new properties.
 * @param character - The identifier for the character to update.
 * @param newCharacter - The new properties to update.
 * @returns The updated character.
 */
export function updateCharacter(character: string, newCharacter: Partial<Character>) {
	return characterState.players((state) => ({
		...state,
		[character]: {
			...state[character],
			...newCharacter,
		} as Character,
	}))[character];
}

/**
 * Updates the movement state of the specified character.
 * @param character - The identifier for the character to update.
 * @param movement - The new movement state to set.
 * @returns The updated character.
 */
export function updateCharacterMovement(character: string, movement: Partial<Character["stats"]["movementState"]>) {
	return characterState.players((state) => ({
		...state,
		[character]: {
			...state[character],
			stats: {
				...state[character]?.stats,
				movementState: movement,
			},
		} as Character,
	}))[character];
}

/**
 * Updates the stamina of the specified character, ensuring that the current value does not exceed the maximum.
 * @param character - The identifier for the character to update.
 * @param stamina - The new stamina data to set.
 * @returns The updated character.
 */
export function updateCharacterStamina(character: string, stamina: Character["stats"]["stamina"]) {
	if (stamina.current !== undefined && stamina.max !== undefined && stamina.current > stamina.max)
		stamina.current = stamina.max;
	return characterState.players((state) => ({
		...state,
		[character]: {
			...state[character],
			stats: {
				...state[character]?.stats,
				stamina: {
					...state[character]?.stats.stamina,
					...stamina,
				},
			},
		} as Character,
	}))[character];
}

export function updateDragging(character: string, dragging: boolean) {
	return characterState.players((state) => ({
		...state,
		[character]: {
			...state[character],
			stats: {
				...state[character]?.stats,
				dragging: dragging,
			},
		} as Character,
	}))[character];
}

/**
 * Selects and returns the state of the specified character.
 * @param character - The identifier for the character to select.
 * @returns The state of the character.
 */
export function selectCharacterState(character: string) {
	return characterState.players()[character];
}

/**
 * Selects and returns the stats of the specified character.
 * @param character - The identifier for the character to select.
 * @returns The stats of the character.
 */
export function selectCharacterStats(character: string) {
	return characterState.players()[character]?.stats;
}

/**
 * Selects and returns the movement state of the specified character.
 * @param character - The identifier for the character to select.
 * @returns The movement state of the character.
 */
export function selectCharacterMovement(character: string) {
	return characterState.players()[character]?.stats.movementState;
}

/**
 * Selects and returns the stamina of the specified character.
 * @param character - The identifier for the character to select.
 * @returns The stamina of the character.
 */
export function selectCharacterStamina(character: string) {
	return characterState.players()[character]?.stats.stamina;
}

/**
 * Selects and returns the speed of the specified character.
 * @param character - The identifier for the character to select.
 * @returns The speed of the character.
 */
export function selectCharacterSpeed(character: string) {
	return characterState.players()[character]?.stats.speed;
}

/**
 * Selects and returns the animation tracks of the specified character.
 * @param character - The identifier for the character to select.
 * @returns The animation tracks of the character.
 */
export function selectCharacterAnimationTracks(character: string) {
	return characterState.players()[character]?.animations;
}

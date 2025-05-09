import { describe, expect, it } from "@rbxts/jest-globals";
import { Character } from "types/character/character";
import {
	clearCharacter,
	loadCharacter,
	selectCharacterAnimationTracks,
	selectCharacterMovement,
	selectCharacterSpeed,
	selectCharacterStamina,
	selectCharacterState,
	selectCharacterStats,
	updateCharacter,
	updateCharacterMovement,
	updateCharacterStamina,
} from "../store/atoms/character";
import { BaseMovement } from "../store/atoms/character/movementAtom";
import { CharacterType } from "../constants/defaultCharacter";

describe("Character State Management", () => {
	const character: Character = {
		id: 1,
		name: "TestCharacter",
		stats: {
			health: { max: 100, current: 150, regen: 3 },
			stamina: { max: 100, regen: 10, current: 50 },
			speed: { normal: 16, boosted: 24 },
			movementState: BaseMovement.Idle,
			dragging: false,
		},
		animations: {},
		characterType: CharacterType.Player,
	};

	it("loads a new character into the state", () => {
		const result = loadCharacter("TestCharacter", character);
		expect(result).toEqual(character);
	});

	it("clears the character data for the specified player", () => {
		loadCharacter("TestCharacter", character);
		const result = clearCharacter("TestCharacter");
		expect(result).toBeUndefined();
	});

	it("updates the character data with new properties", () => {
		loadCharacter("TestCharacter", character);
		const updatedCharacter = { name: "UpdatedCharacter" };
		const result = updateCharacter("TestCharacter", updatedCharacter)!;
		expect(result.name).toBe("UpdatedCharacter");
	});

	it("updates the movement state of the specified character", () => {
		loadCharacter("TestCharacter", character);
		const result = updateCharacterMovement("TestCharacter", BaseMovement.Sprint)!;
		expect(result.stats.movementState).toBe("Sprint");
	});

	it("updates the stamina ensuring current value does not exceed max", () => {
		loadCharacter("TestCharacter", character);
		const newStamina = { current: 120, max: 100, regen: 10 };
		const result = updateCharacterStamina("TestCharacter", newStamina)!;
		expect(result.stats.stamina.current).toBe(100);
	});

	it("selects and returns the state of the specified character", () => {
		loadCharacter("TestCharacter", character);
		const result = selectCharacterState("TestCharacter")!;
		expect(result).toEqual(character);
	});

	it("selects and returns the stats of the specified character", () => {
		loadCharacter("TestCharacter", character);
		const result = selectCharacterStats("TestCharacter")!;
		expect(result).toEqual(character.stats);
	});

	it("selects and returns the movement state of the specified character", () => {
		loadCharacter("TestCharacter", character);
		const result = selectCharacterMovement("TestCharacter")!;
		expect(result).toBe(character.stats.movementState);
	});

	it("selects and returns the stamina of the specified character", () => {
		loadCharacter("TestCharacter", character);
		const result = selectCharacterStamina("TestCharacter")!;
		expect(result).toEqual(character.stats.stamina);
	});

	it("selects and returns the speed of the specified character", () => {
		loadCharacter("TestCharacter", character);
		const result = selectCharacterSpeed("TestCharacter")!;
		expect(result).toEqual(character.stats.speed);
	});

	it("selects and returns the animation tracks of the specified character", () => {
		loadCharacter("TestCharacter", character);
		const result = selectCharacterAnimationTracks("TestCharacter")!;
		expect(result).toEqual(character.animations);
	});
});

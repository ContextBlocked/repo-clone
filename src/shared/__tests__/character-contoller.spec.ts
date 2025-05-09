import { BaseMovement, DerivedPlayerMovement } from "shared/store/atoms/character/movementAtom";
import { StarterCharacter } from "../../types/character/starter_character";
import { beforeEach, describe, expect, it } from "@rbxts/jest-globals";
import { CharacterController } from "../components/CharacterController";
import { calculateSpeed } from "shared/components/input/movement/sprint/calculate";
import { loadCharacter, selectCharacterSpeed, updateCharacterStamina } from "shared/store/atoms/character";
import { CharacterType } from "../constants/defaultCharacter";
import { Character } from "../../types/character/character";
import constants from "../constants";

describe("CharacterController", () => {
	let characterController: CharacterController;
	const character: StarterCharacter = constants.characterModel!;
	character.ScaleTo(constants.sizes.CHARACTER_SCALE);

	beforeEach(() => {
		characterController = new CharacterController();
		const characterAtom: Character = {
			id: 1,
			name: character.Name,
			stats: {
				health: { max: 100, current: 150, regen: 3 },
				stamina: { max: 100, regen: 10, current: 50 },
				speed: { normal: 1, boosted: 1.5 },
				movementState: BaseMovement.Walk,
				dragging: false,
			},
			animations: {},
			characterType: CharacterType.Player,
		};
		loadCharacter(character.Name, characterAtom);
	});

	it("transitions to Sprint state when handleSprint is called with activated true", () => {
		const result = characterController.handleSprint("Sprint", true, character);
		expect(character.GetScale()).toBeCloseTo(constants.sizes.CHARACTER_SCALE);
		expect(result).toBe(Enum.ContextActionResult.Pass);
		expect(math.floor(character.Humanoid.WalkSpeed)).toBe(
			math.floor(calculateSpeed(BaseMovement.Sprint, selectCharacterSpeed(character.Name))),
		);
	});

	it("transitions to Idle state when handleSprint is called with activated false", () => {
		characterController.handleSprint("Sprint", true, character);
		const result = characterController.handleSprint("Sprint", false, character);
		expect(character.GetScale()).toBeCloseTo(constants.sizes.CHARACTER_SCALE);
		expect(result).toBe(Enum.ContextActionResult.Pass);
		expect(math.floor(character.Humanoid.WalkSpeed)).toBe(
			math.floor(calculateSpeed(BaseMovement.Idle, selectCharacterSpeed(character.Name))),
		);
	});

	it("transitions to Crouch state when handleCrouch is called with activated true", () => {
		characterController.handleCrouch(true, character);
		character.ScaleTo(constants.sizes.CHARACTER_CROUCH_SCALE);
		expect(character.GetScale()).toBeCloseTo(constants.sizes.CHARACTER_CROUCH_SCALE);
		expect(math.floor(character.Humanoid.WalkSpeed)).toBe(
			math.floor(calculateSpeed(DerivedPlayerMovement.Crouch, selectCharacterSpeed(character.Name))),
		);
	});

	it("transitions to Idle state when handleCrouch is called with activated false", () => {
		characterController.handleCrouch(true, character);
		characterController.handleCrouch(false, character);
		expect(math.floor(character.Humanoid.WalkSpeed)).toBe(
			math.floor(calculateSpeed(BaseMovement.Idle, selectCharacterSpeed(character.Name))),
		);
	});

	it("transitions to Walk state when handleWalk is called with activated true", () => {
		const result = characterController.handleWalk(true, character);
		expect(result).toBe(Enum.ContextActionResult.Pass);
		expect(math.floor(character.Humanoid.WalkSpeed)).toBe(
			math.floor(calculateSpeed(BaseMovement.Walk, selectCharacterSpeed(character.Name))),
		);
	});

	it("transitions to Idle state when handleWalk is called with activated false", () => {
		characterController.handleWalk(true, character);
		const result = characterController.handleWalk(false, character);
		expect(result).toBe(Enum.ContextActionResult.Pass);
		expect(math.floor(character.Humanoid.WalkSpeed)).toBe(
			math.floor(calculateSpeed(BaseMovement.Idle, selectCharacterSpeed(character.Name))),
		);
	});

	it("does not transition to Sprint state when handleSprint is called with no stamina", () => {
		updateCharacterStamina(character.Name, { current: 0, max: 100, regen: 10 });
		const result = characterController.handleSprint("Sprint", true, character);
		expect(result).toBeUndefined();
		expect(math.floor(character.Humanoid.WalkSpeed)).never.toBe(
			math.floor(calculateSpeed(BaseMovement.Sprint, selectCharacterSpeed(character.Name))),
		);
	});
});

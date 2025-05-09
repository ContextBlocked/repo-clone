import { describe, expect, it } from "@rbxts/jest-globals";
import { BaseMovement, DerivedPlayerMovement, PlayerMovement } from "../store/atoms/character/movementAtom";
import constants from "../constants";
import { calculateSpeed } from "../components/input/movement/sprint/calculate";

describe("calculateSpeed", () => {
	it("returns boosted speed when state is Sprint and speed is provided", () => {
		const state = BaseMovement.Sprint;
		const speed = { boosted: 1.5, normal: 1 };
		const result = calculateSpeed(state, speed);
		expect(result).toBe(constants.walkspeed * 1.5);
	});

	it("returns normal speed when state is Sprint and speed is not provided", () => {
		const state = BaseMovement.Sprint;
		const result = calculateSpeed(state);
		expect(result).toBe(constants.walkspeed);
	});

	it("returns crouch speed when state is Crouch and speed is provided", () => {
		const state = DerivedPlayerMovement.Crouch;
		const speed = { boosted: 1, normal: 1.2 };
		const result = calculateSpeed(state, speed);
		expect(result).toBe(constants.walkspeed * (1.2 - constants.humanoidStats.CROUCH));
	});

	it("returns default crouch speed when state is Crouch and speed is not provided", () => {
		const state = DerivedPlayerMovement.Crouch;
		const result = calculateSpeed(state);
		expect(result).toBe(constants.walkspeed * constants.humanoidStats.CROUCH);
	});

	it("returns normal speed when state is not Sprint or Crouch and speed is provided", () => {
		const state = "OtherState" as PlayerMovement;
		const speed = { boosted: 1, normal: 1.2 };
		const result = calculateSpeed(state, speed);
		expect(result).toBe(constants.walkspeed * 1.2);
	});

	it("returns default speed when state is not Sprint or Crouch and speed is not provided", () => {
		const state = "OtherState" as PlayerMovement;
		const result = calculateSpeed(state);
		expect(result).toBe(constants.walkspeed);
	});
});

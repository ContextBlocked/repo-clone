// src/client/controllers/CharacterController.ts
import { Controller, OnStart } from "@flamework/core";
import {
	BaseMovement,
	CombinedPlayerMovement,
	DerivedPlayerMovement,
	MovementEnum,
} from "shared/store/atoms/character/movementAtom";
import { ContextActionService, Players } from "@rbxts/services";
import {
	selectCharacterAnimationTracks,
	selectCharacterMovement,
	selectCharacterSpeed,
	selectCharacterStamina,
	updateCharacterMovement,
} from "../store/atoms/character";
import { createMotion } from "@rbxts/ripple";
import constants from "../constants";
import { calculateSpeed } from "./input/movement/sprint/calculate";
import { CharacterAnimations } from "../../types/character/character";
import { StarterCharacter } from "../../types/character/starter_character";
import Object from "@rbxts/object-utils";

/**
 * Controller for managing character movement and animations.
 */
@Controller({})
export class CharacterController implements OnStart {
	/**
	 * Called when the controller starts.
	 */
	onStart() {}

	/**
	 * Plays the animation corresponding to the current movement state.
	 * @param state - The current movement state of the character.
	 * @param animations - Optional animations to play.
	 * @param prevState - The previous movement state of the character.
	 */
	animate(state: MovementEnum, animations?: Partial<CharacterAnimations>, prevState?: MovementEnum) {
		if (!animations) return;
		prevState && animations[prevState]?.Stop();
		animations[state]?.Play();
	}

	/**
	 * Transitions the character to a new movement state.
	 * @param newState - The new movement state to transition to.
	 * @param character - The character to transition.
	 * @returns True if the transition was successful, otherwise false.
	 */
	transitionToState(newState: MovementEnum, character: StarterCharacter) {
		if (!character) return false;
		if (newState === selectCharacterMovement(character.Name)) return false;
		const currentMovementState = selectCharacterMovement(character.Name);
		const characterSpeed = selectCharacterSpeed(character.Name);
		const motion = createMotion(character.GetScale(), { start: true });
		// Exit logic for the current state (if needed)
		updateCharacterMovement(character.Name, newState);
		switch (currentMovementState) {
			case BaseMovement.Sprint:
				// e.g., reset sprint speed modifier
				break;
			case DerivedPlayerMovement.Crouch: {
				if (newState === "Ragdoll") break;
				motion.spring(constants.sizes.CHARACTER_SCALE);
				const cleanup = motion.onStep((value) => {
					character.ScaleTo(value);
				});
				const oncomplete = motion.onComplete(() => {
					cleanup();
					oncomplete();
				});
				break;
			}
			case DerivedPlayerMovement.Ragdoll: {
				if (newState === "Crouch") break;
				motion.spring(constants.sizes.CHARACTER_SCALE);
				const cleanup = motion.onStep((value) => {
					character.ScaleTo(value);
				});
				const oncomplete = motion.onComplete(() => {
					character.Humanoid.WalkSpeed = calculateSpeed(BaseMovement.Idle, characterSpeed);
					cleanup();
					oncomplete();
				});
			}
		}
		while (!motion.isComplete()) task.wait();
		const newStateMotion = createMotion(character.GetScale(), { start: true });
		// Enter logic for the new state
		switch (newState) {
			case BaseMovement.Idle:
				character.Humanoid.WalkSpeed = calculateSpeed(newState, characterSpeed);
				this.animate(newState, selectCharacterAnimationTracks(character.Name), currentMovementState);
				break;
			case BaseMovement.Walk:
				character.Humanoid.WalkSpeed = calculateSpeed(newState, characterSpeed);
				this.animate(newState, selectCharacterAnimationTracks(character.Name), currentMovementState);
				break;
			case BaseMovement.Sprint:
				character.Humanoid.WalkSpeed = calculateSpeed(newState, characterSpeed);
				this.animate(newState, selectCharacterAnimationTracks(character.Name), currentMovementState);
				break;
			case DerivedPlayerMovement.Crouch: {
				newStateMotion.spring(constants.sizes.CHARACTER_CROUCH_SCALE);
				const cleanupOnStep = newStateMotion.onStep((value) => {
					character.ScaleTo(value);
				});
				const cleanup = newStateMotion.onComplete(() => {
					character.Humanoid.WalkSpeed = calculateSpeed(newState, characterSpeed);
					cleanupOnStep();
					cleanup();
				});
				this.animate(newState, selectCharacterAnimationTracks(character.Name));
				break;
			}
			case DerivedPlayerMovement.Ragdoll: {
				newStateMotion.spring(constants.sizes.CHARACTER_HIDE_SCALE);
				const cleanupOnStep = newStateMotion.onStep((value) => {
					character.ScaleTo(value);
				});
				const cleanup = newStateMotion.onComplete(() => {
					character.Humanoid.WalkSpeed = calculateSpeed(newState, characterSpeed);
					cleanupOnStep();
					cleanup();
				});
				this.animate(newState, selectCharacterAnimationTracks(character.Name));
				break;
			}

			// ... enter logic for other states
		}
		//print(newState);
		return true;
	}

	/**
	 * Handles the sprint action for the character.
	 * @param actionName - The name of the action being performed.
	 * @param activated - Whether the action is activated or not.
	 * @param character - Optional character to perform the action on.
	 * @returns The result of the context action.
	 */
	handleSprint(actionName: string, activated: boolean, character?: StarterCharacter) {
		character = character || (Players.LocalPlayer.Character as StarterCharacter);
		const currentMovement = selectCharacterMovement(character.Name);
		if (actionName === "NoStamina") {
			this.handleWalk(true, character, actionName);
			return Enum.ContextActionResult.Pass;
		}
		if (currentMovement === BaseMovement.Idle) {
			if (actionName !== "BindWalkToSprint" && activated) {
				ContextActionService.BindAction(
					"BindWalkToSprint",
					(actionName, inputState, inputObject) =>
						inputState !== Enum.UserInputState.Cancel &&
						this.handleSprint(actionName, inputState === Enum.UserInputState.Begin),
					false,
					Enum.PlayerActions.CharacterForward,
				);
				return Enum.ContextActionResult.Pass;
			}
		}
		if (activated) {
			if (selectCharacterStamina(character.Name)!.current <= 0) return;
			this.transitionToState(BaseMovement.Sprint, character);
		} else {
			// Transition to walking or idle based on other input
			if (actionName === "BindWalkToSprint") {
				this.handleWalk(activated, character);
				return Enum.ContextActionResult.Pass;
			}
			ContextActionService.UnbindAction("BindWalkToSprint");
			if (currentMovement !== BaseMovement.Idle) {
				this.handleWalk(true, character, actionName);
			}
		}

		return Enum.ContextActionResult.Pass;
	}

	/**
	 * Handles the crouch action for the character.
	 * @param activated - Whether the crouch action is activated or not.
	 * @param character - Optional character to perform the action on.
	 */
	handleCrouch(activated: boolean, character?: StarterCharacter) {
		character = character || (Players.LocalPlayer.Character as StarterCharacter);
		if (activated) {
			this.transitionToState(DerivedPlayerMovement.Crouch, character);
		} else {
			// Transition to walking or idle based on other input
			const currentMovement = selectCharacterMovement(character.Name);
			this.transitionToState(
				currentMovement === CombinedPlayerMovement.CrouchWalk ? BaseMovement.Walk : BaseMovement.Idle,
				character,
			);
		}
	}

	/**
	 * Handles the walk action for the character.
	 * @param activated - Whether the walk action is activated or not.
	 * @param character - Optional character to perform the action on.
	 * @param actionName - Optional name of the action being performed.
	 * @returns The result of the context action.
	 */
	handleWalk(activated: boolean, character?: StarterCharacter, actionName?: string) {
		character = character || (Players.LocalPlayer.Character as StarterCharacter);
		if (activated) {
			if (
				!Object.isEmpty(ContextActionService.GetBoundActionInfo("BindWalkToSprint")) &&
				actionName === undefined
			)
				return;
			this.transitionToState(BaseMovement.Walk, character);
		} else {
			// Transition to walking or idle based on other input
			this.transitionToState(BaseMovement.Idle, character);
		}
		return Enum.ContextActionResult.Pass;
	}
}

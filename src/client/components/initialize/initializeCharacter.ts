import { BaseComponent, Component } from "@flamework/components";
import { OnStart, OnTick } from "@flamework/core";
import {
	loadCharacter,
	selectCharacterState,
	selectCharacterStats,
	updateCharacterStamina,
} from "../../../shared/store/atoms/character";
import defaultCharacter, { CharacterType } from "../../../shared/constants/defaultCharacter";
import animations, { CharacterAnimationIds } from "../../../shared/constants/animations";
import Object from "@rbxts/object-utils";
import Make from "@rbxts/make";
import { StarterCharacter } from "../../../types/character/starter_character";
import { atom } from "@rbxts/charm";
import { Janitor } from "@rbxts/janitor";
import constants from "../../../shared/constants";
import { CharacterController } from "../../../shared/components/CharacterController";

/**
 * Initializes the character component, managing its state and animations.
 *
 * @class initializeCharacter
 * @extends BaseComponent
 * @implements OnStart, OnTick
 */
@Component({ tag: "character" })
export class initializeCharacter extends BaseComponent<{}, StarterCharacter> implements OnStart, OnTick {
	janitor = new Janitor();
	lastchange = atom(os.clock());

	/**
	 * Creates an instance of initializeCharacter.
	 *
	 * @param {CharacterController} CharacterController - The controller for managing character actions.
	 */
	constructor(private CharacterController: CharacterController) {
		super();
	}

	/**
	 * Updates the character's stamina based on the current movement state.
	 *
	 * @param {number} dt - The delta time since the last tick.
	 */
	onTick(dt: number) {
		const character = selectCharacterStats(this.instance.Name);
		if (!character) return;
		const stamina = character.stamina;
		if (
			character.movementState === "Sprint" &&
			os.clock() - (this.lastchange() - dt) > constants.stamina.RATE_LIMIT
		) {
			updateCharacterStamina(this.instance.Name, {
				...stamina,
				current: stamina?.current - (constants.stamina.DECREMENT_AMOUNT + dt),
			});
			this.lastchange(os.clock());
			if (stamina.current <= 0) this.CharacterController.handleSprint("NoStamina", false, this.instance);
		} else {
			if (stamina.current <= stamina.max && os.clock() - this.lastchange() > constants.stamina.REGEN_DELAY)
				updateCharacterStamina(this.instance.Name, {
					...stamina,
					current: stamina.current + dt,
				});
		}
	}

	/**
	 * Initializes the character when the component starts.
	 */
	onStart() {
		const name = this.instance.Name;
		this.janitor.LinkToInstance(this.instance, false);
		if (selectCharacterState(name)) return;
		loadCharacter(name, {
			name: name,
			id: 0, //TODO: implement id
			characterType: CharacterType.Player,
			stats: defaultCharacter,
			animations: this.loadAnimations(CharacterType.Player, this.instance),
		});
		while (!selectCharacterState(name)) {
			print("waiting for character to load");
			task.wait();
		}
	}

	/**
	 * Loads animations for the character based on its type.
	 *
	 * @param {CharacterType} charactertype - The type of the character.
	 * @param {StarterCharacter} character - The character instance to load animations into.
	 * @returns {Record<keyof CharacterAnimationIds, AnimationTrack>} - The loaded animations.
	 */
	loadAnimations(
		charactertype: CharacterType,
		character: StarterCharacter,
	): Record<keyof CharacterAnimationIds, AnimationTrack> {
		const animId = animations[charactertype];
		const animators = Object.copy(animId) as unknown as Record<keyof CharacterAnimationIds, AnimationTrack>;
		const animator = character.Humanoid.Animator as Animator;
		Object.entries(animId).map(([key, value]) => {
			const animation = Make("Animation", {
				Name: key,
				AnimationId: `rbxassetid://${value}`,
			});
			animators[key] = animator.LoadAnimation(animation);
		});

		return animators;
	}
}

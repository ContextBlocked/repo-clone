import { PlayerMovement } from "../store/atoms/character/movementAtom";
import { CharacterType } from "./defaultCharacter";

export type CharacterAnimationIds = Record<PlayerMovement, number>;
type i = Record<CharacterType, CharacterAnimationIds>;
const playerAniamtions: CharacterAnimationIds = {
	Idle: 0,
	Walk: 742638842,
	Sprint: 782842708,
	Jump: 0,
	Crouch: 0,
	Ragdoll: 0
};
export default {
	[CharacterType.Player]: playerAniamtions,
	[CharacterType.Mob]: playerAniamtions
} satisfies Record<CharacterType, CharacterAnimationIds>

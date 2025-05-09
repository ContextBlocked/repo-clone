import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import constants from "../../shared/constants";
import { loadCharacter, selectCharacterState } from "../../shared/store/atoms/character";
import defaultCharacter, { CharacterType } from "../../shared/constants/defaultCharacter";

@Component({ tag: "player" })
export class initialize_player extends BaseComponent<{}, Player> implements OnStart {
	onStart() {
		this.instance.CharacterAdded.Connect((character) => {
			this.onCharacterAdded(character);
		});
		this.initializeCharacter();
		this.loadCharacter();
	}
	initializeCharacter() {}
	loadCharacter() {
		this.instance.LoadCharacter();
	}
	onCharacterAdded(character: Model) {
		character.ScaleTo(constants.sizes.CHARACTER_SCALE);
		loadCharacter(this.instance.Name, {
			id: this.instance.UserId,
			name: this.instance.Name,
			stats: defaultCharacter,
			characterType: CharacterType.Player,
			animations: {},
			...selectCharacterState(this.instance.Name),
		});
		character.AddTag("character");
		character.AddTag("player-character");
	}
}

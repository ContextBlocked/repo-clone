import { Controller, OnStart } from "@flamework/core";
import { ContextActionService, Players } from "@rbxts/services";
import { CharacterController } from "../../../shared/components/CharacterController";
import constants from "../../../shared/constants";
import { dragController } from "./drag-controller";
import { characterSettings } from "../../store/atoms/characterSettingsAtom";

@Controller({})
export class Input implements OnStart {
	constructor(private readonly controller: CharacterController, private dragController: dragController) {}

	updateSettingsDistance(actionName: string, inputState: Enum.UserInputState, inputObject: InputObject) {
		print(math.clamp(characterSettings().distance + inputObject.Position.Z, 1, 20));
		characterSettings((state) => ({
			...state,
			distance: math.clamp(state.distance + inputObject.Position.Z, 1, 20),
		}));
		return Enum.ContextActionResult.Sink;
	}

	onStart() {
		this.bindMovementActions();
	}

	private bindMovementActions() {
		ContextActionService.BindAction(
			"Sprint",
			(actionName, inputState, inputObject) =>
				inputState !== Enum.UserInputState.Cancel &&
				this.controller.handleSprint(actionName, inputState === Enum.UserInputState.Begin),
			false,
			constants.KEYBINDS.Sprint!,
		);
		ContextActionService.BindAction(
			"Crouch",
			(actionName, inputState, inputObject) =>
				inputState !== Enum.UserInputState.Cancel &&
				this.controller.handleCrouch(inputState === Enum.UserInputState.Begin),
			false,
			constants.KEYBINDS.Crouch!,
		);
		ContextActionService.BindAction(
			"Walk",
			(actionName, inputState, inputObject) =>
				inputState !== Enum.UserInputState.Cancel &&
				this.controller.handleWalk(inputState === Enum.UserInputState.Begin),
			false,
			Enum.PlayerActions.CharacterForward,
		);
		ContextActionService.BindAction(
			"Drag",
			(actionName, inputState, inputObject) =>
				this.dragController.drag(actionName, inputState, inputObject, Players.LocalPlayer.Character!),
			false,
			Enum.UserInputType.MouseButton1,
		);
		ContextActionService.BindAction(
			"UpdateSettingsDistance",
			(actionName, inputState, inputObject) => this.updateSettingsDistance(actionName, inputState, inputObject),
			false,
			Enum.UserInputType.MouseWheel,
		);
	}
}

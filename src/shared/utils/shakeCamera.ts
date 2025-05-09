import CameraShaker from "@rbxts/camera-shaker";
import { Workspace } from "@rbxts/services";

export function shakeCamera(duration: number, frequency: number) {
	const camShake = new CameraShaker(
		Enum.RenderPriority.Camera.Value,
		(shakeCFrame) => (Workspace.CurrentCamera!.CFrame = Workspace.CurrentCamera!.CFrame.mul(shakeCFrame)),
	);
	camShake.Start();
	return new Promise<void>((resolve) =>
		task.spawn(() => {
			for (let i = 0; i < duration; i += frequency) {
				camShake.Shake(CameraShaker.Presets.Bump); //TODO: add shakeInstance parameter
				task.wait(frequency);
			}
			resolve();
		}),
	);
}

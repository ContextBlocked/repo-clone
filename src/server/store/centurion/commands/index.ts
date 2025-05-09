import { CommandGuard } from "@rbxts/centurion";
import { GroupService } from "@rbxts/services";

export const isOwner: CommandGuard = (ctx) => {
	if (
		(game.CreatorId !== 0 && ctx.executor.UserId !== game.CreatorId) ??
		GroupService.GetGroupInfoAsync(game.CreatorId).Owner.Id
	) {
		ctx.error("You are not the owner of this game. " + game.CreatorId);
		return false;
	}
	return true;
};

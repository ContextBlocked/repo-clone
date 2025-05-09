import { CenturionType, Command, CommandContext, Group, Guard, Register } from "@rbxts/centurion";
import { isOwner } from "./index";
import { GameState, setGameState } from "../../../../shared/store/atoms/game-atom";
import { completeCurrentCollector, money } from "../../../../shared/store/atoms/money-atom";
import { levelservice } from "../../../services/level-service";

@Register({
	groups: [
		{
			name: "game",
			description: "game commands",
		},
	],
})
@Group("game")
export class LevelCommands {
	constructor(private levelService: levelservice) {}
	@Command({
		name: "startLevel",
		description: "Prepares the level for play",
		arguments: [
			{
				name: "level",
				description: "the level to start",
				type: CenturionType.Number,
			},
			{
				name: "noGoal",
				description: "if true, the goal will be $1",
				type: CenturionType.Boolean,
				optional: true,
			},
		],
	})
	@Guard(isOwner)
	startLevel(ctx: CommandContext, level: number, noGoal?: boolean) {
		setGameState(GameState.Loading);
		task.delay(3, () =>
			money((prev) => ({
				...prev,
				goal: noGoal ? 1 : prev.goal,
			})),
		);
		ctx.reply(`Level ${level} started.`);
	}
	@Command({
		name: "endLevel",
		description: "End the level",
	})
	@Guard(isOwner)
	endLevel(ctx: CommandContext) {
		levelservice.cleanupLevel();
		ctx.reply("Level ended.");
	}

	@Command({
		name: "setCollectorGoal",
		description: "Sets the goal for the current collector.",
		arguments: [
			{
				name: "goal",
				description: "The target amount for the current collector.",
				type: CenturionType.Number,
				optional: true,
			},
		],
	})
	@Guard(isOwner)
	setCollectorGoal(ctx: CommandContext, goal: number = 1) {
		money((prev) => ({
			...prev,
			goal: goal,
		}));
		ctx.reply(`Current collector goal set to $${goal}.`);
	}

	@Command({
		name: "completeCollector",
		description: "Manually completes the current collector.",
	})
	@Guard(isOwner)
	completeCollector(ctx: CommandContext) {
		const currentMoney = money();
		if (currentMoney.collectorsCompleted >= currentMoney.collectorsRequired) {
			ctx.reply("All collectors are already completed for this level.");
			return;
		}
		completeCurrentCollector(); // This handles incrementing completed count and resetting current money
		ctx.reply(`Collector ${currentMoney.collectorsCompleted + 1} completed. The next collector is now ready.`);
		// No longer automatically activating the next collector here.
	}

	// Removed the activateNextCollector command as activation is now player-driven.

	@Command({
		name: "setMoney",
		description: "Sets the current money amount for the active collector.",
		arguments: [
			{
				name: "amount",
				description: "The amount to set. Defaults to the current collector's goal if omitted.",
				type: CenturionType.Number,
				optional: true,
			},
		],
	})
	@Guard(isOwner)
	setMoney(ctx: CommandContext, amount?: number) {
		const currentMoneyState = money();
		const targetAmount = amount ?? currentMoneyState.goal; // Default to goal if amount is nil

		money((prev) => ({
			...prev,
			current: targetAmount,
		}));

		ctx.reply(`Current money set to $${targetAmount}.`);
	}
}

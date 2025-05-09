export function isPlayerNearby(player: Player, part: Part, distance: number): boolean {
	if (player.Character && player.Character.PrimaryPart) {
		const playerPosition = player.Character.PrimaryPart.Position;
		const collectorPosition = part.Position;
		const magnitude = playerPosition.sub(collectorPosition).Magnitude;
		return magnitude <= distance;
	}
	return false;
}

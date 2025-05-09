import { OnStart, Service } from "@flamework/core";
import { CollectionService } from "@rbxts/services";
import { levelservice } from "./level-service";
import { Collector } from "types/collector";
import { isPlayerNearby } from "shared/utils/isPlayerNearby";
import { Janitor } from "@rbxts/janitor";
import { Events } from "../network";

const ACTIVATION_DISTANCE = 15; // Max distance player can be from collector to activate

@Service({})
export class CollectorActivationService implements OnStart {
	private janitor = new Janitor<any>();

	constructor(private levelService: levelservice) {}

	onStart() {
		// Handle collectors already present when the service starts
		CollectionService.GetTagged("ready-collector").forEach((instance) =>
			this.setupCollectorListener(instance as Collector),
		);

		// Handle collectors added later
		this.janitor.Add(
			CollectionService.GetInstanceAddedSignal("ready-collector").Connect((instance) =>
				this.setupCollectorListener(instance as Collector),
			),
			"Disconnect",
		);
	}

	/**
	 * Cleans up all connections when the service itself might be stopped.
	 */
	destroy() {
		this.janitor.Destroy();
	}

	private setupCollectorListener(collector: Collector) {
		const clickDetector = collector.Shell.Button.ClickDetector;
		const collectorId = (collector.GetAttribute("id") as number | undefined) ?? collector.Name; // Use ID or Name for logging

		if (!clickDetector) {
			warn(`Collector ${collector.Name} (ID: ${collectorId}) is missing its ClickDetector.`);
			return;
		}

		const collectorJanitor = new Janitor(); // Janitor specific to this collector's connections

		collectorJanitor.Add(
			clickDetector.MouseClick.Connect((player) => this.handleCollectorClick(player, collector)),
			"Disconnect",
		);

		// Store this collector's janitor using its name or a unique identifier
		// This allows cleanup if the collector instance is removed.
		this.janitor.Add(collectorJanitor, "Cleanup", collector.Name);
	}

	private handleCollectorClick(player: Player, collector: Collector) {
		const collectorId = (collector.GetAttribute("id") as number | undefined) ?? collector.Name;

		// Validate player proximity
		const character = player.Character;
		const collectorPart = collector.PrimaryPart ?? collector.FindFirstChildWhichIsA("BasePart");
		if (!character || !collectorPart) {
			warn(`Cannot validate activation click for ${player.Name}: Missing character or collector part.`);
			return;
		}

		if (!isPlayerNearby(player, collectorPart, ACTIVATION_DISTANCE)) {
			warn(
				`Player ${player.Name} too far to activate collector ${collector.Name} (ID: ${collectorId}) via click.`,
			);
			// Optionally, send feedback to the player via a client remote event
			return;
		}

		// Attempt to activate the collector
		print(`Player ${player.Name} activating collector ${collector.Name} (ID: ${collectorId}) via click.`);
		const activated = levelservice.activateCollector(collector);

		if (!activated) {
			warn(`Failed to activate collector ${collector.Name} (ID: ${collectorId}) despite player click.`);
			// Optionally, send feedback to the player
		}
		// The collectorId was already determined earlier in this function
		if (activated && typeIs(collectorId, "number")) {
			// Fire event for visual change on clients, sending the ID
			Events.collectorActivatedVisuals.broadcast(collectorId);
		} else if (!activated) {
			warn(`Failed to activate collector ${collector.Name} (ID: ${collectorId}) despite player click.`);
			// Optionally, send feedback to the player
		}
	}
}

import { StarterCharacter } from "./character/starter_character";
import { LootFolder } from "./lootModel";
import { Collector } from "./collector";
import { Shop } from "./shop";
import consumables from "../shared/constants/items/consumables";
import Weapons from "../shared/constants/items/weapons";
import medkits from "../shared/constants/items/consumables/medkits";

declare global {
	interface StarterPlayerScripts extends Instance {
		StarterCharacter: StarterCharacter;
	}
	interface ServerStorage extends Instance {
		loot: LootFolder;
		collector: Collector;
		shop: Shop;
		maps: Folder & Model[];
		consumables: Folder &
			{
				[key in keyof typeof consumables]?: Part[];
			};
		weapons: Folder &
			{
				[key in keyof typeof Weapons]?: Part[];
			};
		medkits: Folder &
			{
				[key in keyof typeof medkits]?: Part[];
			};
		moneyBag: Model & {
			PrimaryPart: Part;
		};
	}

	interface Workspace extends Instance {
		audio: Folder & {
			CollectorBeep: AudioPlayer;
		};
	}
}

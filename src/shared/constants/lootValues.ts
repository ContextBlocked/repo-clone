import { Loot } from "../../types/lootModel";

interface LootProps {
	value: number;
	weight: number;
}

export const lootValues: Record<keyof Loot, LootProps> = {
	//Amber: 600,
	Amber: {
		value: 600,
		weight: 1,
	},
	Ukulele: {
		value: 1600,
		weight: 3,
	},
	//Diamond: 1200,
	Diamond: {
		value: 1200,
		weight: 1,
	},
};

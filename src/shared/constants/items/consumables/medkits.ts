import { Consumable } from "../../../../types/Items/consumable";
import { Weight } from "../index";

import { Stat } from "../../defaultCharacter";

export default {
	smallMedkit: {
		name: "Small Medkit",
		price: 5000,
		weight: Weight.light,
		uses: 1,
		stat: Stat.health,
		amount: 25,
	},
	mediumMedkit: {
		name: "Medium Medkit",
		price: 10000,
		weight: Weight.medium,
		uses: 1,
		stat: Stat.health,
		amount: 50,
	},
	largeMedkit: {
		name: "Large Medkit",
		price: 20000,
		weight: Weight.heavy,
		uses: 1,
		stat: Stat.health,
		amount: 100,
	},
} satisfies Record<string, Consumable>;

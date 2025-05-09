import { Consumable } from "../../../../types/Items/consumable";
import { Weight } from "../index";
import { Stat } from "../../defaultCharacter";

export default {
	healthBoost: {
		name: "Health Boost",
		price: 5000,
		weight: Weight.light,
		uses: 1,
		stat: Stat.health,
		amount: 20,
	},
	staminaBoost: {
		name: "Stamina Boost",
		price: 5000,
		weight: Weight.light,
		uses: 1,
		stat: Stat.stamina,
		amount: 10,
	},
	speedBoost: {
		name: "Speed Boost",
		price: 5000,
		weight: Weight.light,
		uses: 1,
		stat: Stat.speed,
		amount: 5,
	}
} satisfies Record<string, Consumable>;

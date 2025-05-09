import { RangedWeapon } from "../../../../../types/Items/weapon";
import { Accuracy, Range, Speed, Weight } from "../../index";

export const RangedWeapons: Record<string, RangedWeapon> = {
	Crossbow: {
		name: "Crossbow",
		price: 30000,
		weight: Weight.medium,
		accuracy: Accuracy.medium,
		uses: 20,
		speed: Speed.slow,
		range: Range.long,
		damage: 40,
		stun: false,
		trip: false,
		knockback: false,
	},
	Pistol: {
		name: "Pistol",
		price: 50000,
		weight: Weight.light,
		uses: 30,
		accuracy: Accuracy.high,
		speed: Speed.fast,
		range: Range.long,
		damage: 30,
		stun: false,
		trip: false,
		knockback: false,
	},
};

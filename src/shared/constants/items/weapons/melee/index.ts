import { MeleeWeapon } from "types/Items/weapon";
import { Weight } from "../..";

export const MeleeWeapons: Record<string, MeleeWeapon> = {
	Bat: {
		name: "Baseball Bat",
		price: 25000,
		weight: Weight.light,
		uses: 0,
		damage: 20,
		stun: true,
		trip: true,
		knockback: true,
	},
};

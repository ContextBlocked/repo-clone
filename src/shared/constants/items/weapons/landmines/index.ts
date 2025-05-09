import { LandmineWeapon } from "../../../../../types/Items/weapon";
import { Weight } from "../../index";

export const LandmineWeapons: Record<string, LandmineWeapon> = {
	shockmine: {
		name: "Shockmine",
		price: 3000,
		weight: Weight.light,
		uses: 1,
		damage: 0,
		stun: true,
		trip: false,
		knockback: false,
	},
};

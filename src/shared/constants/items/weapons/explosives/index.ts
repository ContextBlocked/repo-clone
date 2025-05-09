import { ExplosiveWeapon } from "../../../../../types/Items/weapon";
import { Radius, Weight } from "../../index";

export const ExplosiveWeapons: Record<string, ExplosiveWeapon> = {
	Grenade: {
		name: "Grenade",
		price: 3000,
		weight: Weight.light,
		uses: 1,
		cookTime: 3,
		radius: Radius.medium,
		damage: 75,
		stun: false,
		trip: false,
		knockback: true,
	},
	StunGrenade: {
		name: "Stun Grenade",
		price: 5000,
		weight: Weight.light,
		uses: 1,
		cookTime: 2,
		radius: Radius.medium,
		damage: 0,
		stun: true,
		trip: false,
		knockback: false,
	},
};

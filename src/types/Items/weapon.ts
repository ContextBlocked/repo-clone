import { ItemBase } from "./item";
import { Accuracy, Radius, Range, Speed } from "../../shared/constants/items";

export interface WeaponItem extends ItemBase {
	damage: number;
	stun: boolean;
	trip: boolean;
	knockback: boolean;
}

export interface RangedWeapon extends WeaponItem {
	accuracy: Accuracy;
	speed: Speed;
	range: Range;
}

export interface MeleeWeapon extends WeaponItem {}

export interface ExplosiveWeapon extends WeaponItem {
	cookTime: number;
	radius: Radius;
}

export interface LandmineWeapon extends WeaponItem {}

export type Weapon = RangedWeapon | MeleeWeapon | ExplosiveWeapon | LandmineWeapon;

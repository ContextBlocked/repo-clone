import { WeaponItem } from "./weapon";
import { Consumable } from "./consumable";
import { Weight } from "../../shared/constants/items";

export interface ItemBase {
	name: Capitalize<string>;
	price: number;
	weight: Weight;
	uses: number;
}

export type Item = WeaponItem | Consumable;

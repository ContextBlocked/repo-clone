import { ItemBase } from "./item";
import { Stat } from "../../shared/constants/defaultCharacter";

export interface Consumable extends ItemBase {
	stat: Stat;
	amount: number;
}

import { ExplosiveWeapons } from "./explosives";
import { RangedWeapons } from "./ranged";
import { MeleeWeapons } from "./melee";
import { LandmineWeapons } from "./landmines";

export default {
	...ExplosiveWeapons,
	...RangedWeapons,
	...MeleeWeapons,
	...LandmineWeapons,
};

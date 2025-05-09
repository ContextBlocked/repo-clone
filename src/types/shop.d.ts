export type Shop = Model & {
	itemSpawns: Folder & {
		["itemSpawn"]?: Part[];
	};
	consumableSpawns: Folder & {
		["consumableSpawn"]?: Part[];
	};
};

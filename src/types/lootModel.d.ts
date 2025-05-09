export interface LootModel extends Model {
	Name: keyof Loot;
	PrimaryPart: Part;
}

export interface LootAttributes {
	id: number;
	value?: number;
	weight?: number;
}
type Loot = {
	Amber: Model & {
		PackageLink: PackageLink;
		["Meshes/Amber"]: MeshPart;
	};
	Ukulele: Model & {
		PackageLink: PackageLink;
		ukulele: MeshPart;
	};
	Diamond: Model & {
		["Meshes/Diamond"]: MeshPart;
	};
};
export type LootFolder = Folder & Loot;

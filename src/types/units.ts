export type Faction = 'GDI' | 'Nod' | 'Mutant' | 'Neutral';
export type UnitCategory = 'Infantry' | 'Vehicle' | 'Aircraft' | 'Structure';
export type RenderType = 'SHP' | 'VOXEL';

export interface BaseUnit {
  id: string;
  internalName: string;
  displayName: string;
  faction: Faction;
  category: UnitCategory;
  cost: number;
  strength: number;
  speed: number;
  techLevel: number;
  imageUrl?: string;
}

export interface DefaultUnit extends BaseUnit {
  type: 'default';
}

export interface CustomUnit extends BaseUnit {
  type: 'custom';
  renderType?: RenderType;
  shpFilePath?: string;
  icon_file_path?: string;
  voxelFilePath?: string;
  hvaFilePath?: string;
  turretVxlPath?: string;
  barrelVxlPath?: string;
  cameoFilePath?: string;
  previewImageUrl?: string;
  creatorNotes?: string;
  rulesJson?: Record<string, unknown>;
  artJson?: Record<string, unknown>;
  // Structure-specific
  foundation?: string;
  power?: number;
  powerDrain?: number;
  buildCat?: string;
  isFactory?: boolean;
  hasBib?: boolean;
  buildupFilePath?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Unit = DefaultUnit | CustomUnit;

export interface ExportProgress {
  percentage: number;
  message: string;
  isExporting: boolean;
  error?: string;
}

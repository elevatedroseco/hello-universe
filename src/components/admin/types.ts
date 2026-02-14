export type RenderType = 'SHP' | 'VOXEL';

export interface UnitForm {
  // Identity
  internalName: string;
  displayName: string;
  faction: 'GDI' | 'Nod' | 'Mutant';
  category: 'Infantry' | 'Vehicle' | 'Aircraft' | 'Structure';

  // Render type
  renderType: RenderType;

  // General
  techLevel: number;
  cost: number;
  points: number;
  prerequisite: string;

  // Combat
  primaryWeapon: string;
  eliteWeapon: string;
  warhead: string;
  strength: number;
  armor: string;
  rof: number;
  range: number;

  // Physics
  speed: number;
  sight: number;
  locomotor: string;
  crushable: boolean;
  crusher: boolean;
  cloakable: boolean;
  sensors: boolean;
  fearless: boolean;
  tiberiumHeal: boolean;

  // Art
  sequence: string;

  // Voxel-specific
  primaryFireFLH: string;
  secondaryFireFLH: string;
  hasTurret: boolean;
  hasBarrel: boolean;
  turretOffset: number;

  // Structure-specific
  foundation: string;
  power: number;
  powerDrain: number;
  buildCat: string;
  isFactory: boolean;
  hasBib: boolean;

  // Voice
  voicePreset: string;
  voiceSelect: string;
  voiceMove: string;
  voiceAttack: string;
  voiceFeedback: string;

  // Files
  spriteFile: File | null;
  iconFile: File | null;
  vxlFile: File | null;
  hvaFile: File | null;
  turretVxlFile: File | null;
  barrelVxlFile: File | null;
  buildupFile: File | null;
}

export const DEFAULT_FORM: UnitForm = {
  internalName: '',
  displayName: '',
  faction: 'GDI',
  category: 'Infantry',
  renderType: 'SHP',
  techLevel: 1,
  cost: 300,
  points: 3,
  prerequisite: 'GAPILE',
  primaryWeapon: 'M1Carbine',
  eliteWeapon: '',
  warhead: 'SA',
  strength: 200,
  armor: 'none',
  rof: 45,
  range: 5,
  speed: 4,
  sight: 5,
  locomotor: 'Foot',
  crushable: true,
  crusher: false,
  cloakable: false,
  sensors: false,
  fearless: false,
  tiberiumHeal: false,
  sequence: 'InfantrySequence',
  primaryFireFLH: '0,0,100',
  secondaryFireFLH: '0,0,100',
  hasTurret: false,
  hasBarrel: false,
  turretOffset: 0,
  voicePreset: 'GDI_standard',
  voiceSelect: '15-I000,15-I004',
  voiceMove: '15-I006,15-I010',
  voiceAttack: '15-I020,15-I022',
  voiceFeedback: '15-I058',
  foundation: '3x2',
  power: 0,
  powerDrain: 0,
  buildCat: 'GDIBUILDING',
  isFactory: false,
  hasBib: false,
  spriteFile: null,
  iconFile: null,
  vxlFile: null,
  hvaFile: null,
  turretVxlFile: null,
  barrelVxlFile: null,
  buildupFile: null,
};

export interface UnitForm {
  // Identity
  internalName: string;
  displayName: string;
  faction: 'GDI' | 'Nod' | 'Mutant';
  category: 'Infantry' | 'Vehicle' | 'Aircraft';

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

  // Voice
  voicePreset: string;
  voiceSelect: string;
  voiceMove: string;
  voiceAttack: string;
  voiceFeedback: string;

  // Files
  spriteFile: File | null;
  iconFile: File | null;
}

export const DEFAULT_FORM: UnitForm = {
  internalName: '',
  displayName: '',
  faction: 'GDI',
  category: 'Infantry',
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
  voicePreset: 'GDI_standard',
  voiceSelect: '15-I000,15-I004',
  voiceMove: '15-I006,15-I010',
  voiceAttack: '15-I020,15-I022',
  voiceFeedback: '15-I058',
  spriteFile: null,
  iconFile: null,
};

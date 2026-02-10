export const TS_WEAPONS = {
  infantry: [
    { id: 'M1Carbine',          label: 'M1 Carbine',           damage: 25,  targets: 'Infantry',            faction: 'GDI',     notes: 'Light infantry rifle — E1' },
    { id: 'GrenadeLauncher',    label: 'Grenade Launcher',      damage: 50,  targets: 'All',                 faction: 'GDI',     notes: 'Area damage — Disc Thrower' },
    { id: 'SniperRifle',        label: 'Sniper Rifle',          damage: 999, targets: 'Infantry',            faction: 'GDI',     notes: 'One-shot kills — Ghost Stalker' },
    { id: 'TacLaser',           label: 'Tactical Laser',        damage: 150, targets: 'All',                 faction: 'GDI',     notes: 'Laser weapon — Commando' },
    { id: 'M60mg',              label: 'M60 Machine Gun',       damage: 40,  targets: 'Infantry',            faction: 'GDI',     notes: 'Rapid fire — Mutant Hijacker' },
    { id: 'TiberiumAutoRifle',  label: 'Tiberium Auto Rifle',   damage: 30,  targets: 'Infantry',            faction: 'Mutant',  notes: 'Tiberium-infused rounds' },
    { id: 'NodMachineGun',      label: 'Nod Machine Gun',       damage: 25,  targets: 'Infantry',            faction: 'Nod',     notes: 'Light Nod infantry — E3' },
    { id: 'Bazooka',            label: 'Bazooka',               damage: 60,  targets: 'Vehicles/Buildings',  faction: 'Nod',     notes: 'Anti-armor rocket — RPG trooper' },
    { id: 'Vulcan',             label: 'Vulcan Cannon',         damage: 40,  targets: 'All',                 faction: 'Nod',     notes: 'Rapid-fire cannon — Cyborg' },
    { id: 'SubMachineGun',      label: 'Sub Machine Gun',       damage: 20,  targets: 'Infantry',            faction: 'Nod',     notes: 'Close-range SMG' },
    { id: 'NapalmBomb',         label: 'Napalm Bomb',           damage: 100, targets: 'Infantry/Buildings',  faction: 'Nod',     notes: 'Fire damage, area effect' },
    { id: 'TiberiumSpray',      label: 'Tiberium Spray',        damage: 75,  targets: 'Infantry',            faction: 'Mutant',  notes: 'Toxic spray — Tiberium mutant' },
  ],
  vehicle: [
    { id: 'AssaultCannon',      label: 'Assault Cannon',        damage: 70,  targets: 'Infantry/Light',      faction: 'GDI',     notes: 'Wolverine primary' },
    { id: '120mm',              label: '120mm Cannon',          damage: 200, targets: 'Vehicles/Buildings',  faction: 'GDI',     notes: 'Titan main gun' },
    { id: 'RailGun',            label: 'Rail Gun',              damage: 500, targets: 'All',                 faction: 'GDI',     notes: 'Disruptor — energy piercing' },
    { id: 'Missiles',           label: 'MLRS Missiles',         damage: 120, targets: 'All',                 faction: 'GDI',     notes: 'Hover MLRS salvo fire' },
    { id: 'SonicWave',          label: 'Sonic Wave',            damage: 300, targets: 'Vehicles/Buildings',  faction: 'GDI',     notes: 'Disruptor harmonic wave' },
    { id: 'MammothTusk',        label: 'Mammoth Tusk Missiles', damage: 150, targets: 'All',                 faction: 'GDI',     notes: 'Mammoth Mk.II secondary' },
    { id: 'MammothCannon',      label: 'Mammoth Cannon',        damage: 300, targets: 'Vehicles/Buildings',  faction: 'GDI',     notes: 'Mammoth Mk.II primary' },
    { id: 'NodLaser',           label: 'Nod Laser',             damage: 250, targets: 'All',                 faction: 'Nod',     notes: 'Laser tank beam' },
    { id: 'ChemMissile',        label: 'Chem Missile',          damage: 200, targets: 'Infantry/Soft',       faction: 'Nod',     notes: 'Chemical warhead — toxin' },
    { id: 'FlameGun',           label: 'Flame Gun',             damage: 80,  targets: 'Infantry/Buildings',  faction: 'Nod',     notes: 'Devil\'s Tongue flame' },
    { id: 'TankCannon',         label: 'Tank Cannon',           damage: 180, targets: 'Vehicles/Buildings',  faction: 'Nod',     notes: 'Tick Tank / standard shell' },
    { id: 'RocketLauncher',     label: 'Rocket Launcher',       damage: 100, targets: 'All',                 faction: 'Nod',     notes: 'Attack Bike dual launchers' },
    { id: 'ArticulatedCannon',  label: 'Articulated Cannon',    damage: 400, targets: 'Vehicles/Buildings',  faction: 'Nod',     notes: 'Artillery — must deploy' },
  ],
  aircraft: [
    { id: 'Hellfire',           label: 'Hellfire Missile',      damage: 150, targets: 'Vehicles/Buildings',  faction: 'GDI',     notes: 'Orca Fighter primary' },
    { id: 'OrcaBomb',           label: 'Orca Bomb',             damage: 250, targets: 'Buildings',           faction: 'GDI',     notes: 'Orca Bomber payload' },
    { id: 'OrcaTransport',      label: 'None (Transport)',      damage: 0,   targets: 'N/A',                 faction: 'GDI',     notes: 'Orca Transport — unarmed' },
    { id: 'HarpyGun',           label: 'Harpy Minigun',         damage: 40,  targets: 'Infantry',            faction: 'Nod',     notes: 'Harpy strafing run' },
    { id: 'BansheeGun',         label: 'Banshee Cannon',        damage: 180, targets: 'Vehicles',            faction: 'Nod',     notes: 'Banshee twin cannons' },
    { id: 'CarpetBomb',         label: 'Carpet Bomb',           damage: 200, targets: 'All',                 faction: 'Nod',     notes: 'Heavy bomber payload' },
  ],
} as const;

export const TS_WARHEADS = [
  { id: 'AP',         label: 'Armor Piercing (AP)',    description: 'Best vs. heavy armor, weak vs. infantry' },
  { id: 'HE',         label: 'High Explosive (HE)',   description: 'Best vs. infantry and soft targets' },
  { id: 'SA',         label: 'Small Arms (SA)',        description: 'Rifle rounds — minimal vs. armor' },
  { id: 'Laser',      label: 'Laser',                  description: 'Ignores armor — consistent damage' },
  { id: 'Fire',       label: 'Incendiary',             description: 'Flame damage — great vs. infantry' },
  { id: 'Tiberium',   label: 'Tiberium',               description: 'Toxic — poisons infantry' },
  { id: 'Sonic',      label: 'Sonic',                  description: 'Disruption — damages through walls' },
  { id: 'ChemSpray',  label: 'Chemical Spray',         description: 'Area toxin — persistent cloud' },
] as const;

export const TS_ARMOR_TYPES = [
  { id: 'none',       label: 'None',      description: 'No armor — light infantry' },
  { id: 'light',      label: 'Light',     description: 'Light armor — basic vehicles' },
  { id: 'medium',     label: 'Medium',    description: 'Medium — standard tanks' },
  { id: 'heavy',      label: 'Heavy',     description: 'Heavy — Mammoth, Titan' },
  { id: 'concrete',   label: 'Concrete',  description: 'Maximum — buildings only' },
] as const;

export const TS_LOCOMOTORS = [
  { id: 'Foot',   guid: '{4A582741-9839-11d1-B709-00A024DDAFD1}', label: 'Foot',         description: 'Infantry walking' },
  { id: 'Drive',  guid: '{4A582742-9839-11d1-B709-00A024DDAFD1}', label: 'Tracked',      description: 'Tank treads — Titan, Tick Tank' },
  { id: 'Wheel',  guid: '{4A582743-9839-11d1-B709-00A024DDAFD1}', label: 'Wheeled',      description: 'Fast wheeled — Attack Buggy' },
  { id: 'Fly',    guid: '{4A582744-9839-11d1-B709-00A024DDAFD1}', label: 'Aircraft',     description: 'Airborne — Orca, Banshee' },
  { id: 'Hover',  guid: '{4A582745-9839-11d1-B709-00A024DDAFD1}', label: 'Hover',        description: 'Amphibious hover — HMEC' },
  { id: 'Mech',   guid: '{4A582741-9839-11d1-B709-00A024DDAFD1}', label: 'Bipedal Mech', description: 'Walker — Titan, Wolverine' },
  { id: 'Sub',    guid: '{4A582746-9839-11d1-B709-00A024DDAFD1}', label: 'Subterranean', description: 'Underground — Devil\'s Tongue' },
] as const;

export const TS_PREREQUISITES: Record<string, string[]> = {
  GDI:    ['GAWEAP', 'GAAIRC', 'GAPILE', 'GAPOWR', 'GATECH', 'GACNST', 'GADEPT'],
  Nod:    ['NAHAND', 'NAWEAP', 'NAAIRCR', 'NAPOWR', 'NATECH', 'NACNST'],
  Mutant: ['GAWEAP', 'NAHAND'],
};

export const TS_VOICE_SETS: Record<string, Record<string, { label: string; Select: string; Move: string; Attack: string; Feedback: string }>> = {
  Infantry: {
    GDI_standard: {
      label: 'GDI Standard Infantry',
      Select:  '15-I000,15-I004,15-I012,15-I048',
      Move:    '15-I006,15-I010,15-I014,15-I016',
      Attack:  '15-I020,15-I022,15-I034,15-I036',
      Feedback: '15-I058,15-I064',
    },
    Nod_standard: {
      label: 'Nod Standard Infantry',
      Select:  '15-I000,15-I004,15-I012',
      Move:    '15-I006,15-I010,15-I014',
      Attack:  '15-I020,15-I022,15-I034',
      Feedback: '15-I058,15-I064',
    },
    commando: {
      label: 'Commando / Hero Voice',
      Select:  '15-I100,15-I101,15-I102',
      Move:    '15-I106,15-I107',
      Attack:  '15-I110,15-I111,15-I112',
      Feedback: '15-I120',
    },
  },
};

// Weapon → warhead auto-suggestions
export const WEAPON_WARHEAD_MAP: Record<string, string> = {
  M1Carbine: 'SA',
  NodMachineGun: 'SA',
  SubMachineGun: 'SA',
  M60mg: 'SA',
  Bazooka: 'AP',
  '120mm': 'AP',
  TankCannon: 'AP',
  MammothCannon: 'AP',
  RailGun: 'AP',
  ArticulatedCannon: 'HE',
  GrenadeLauncher: 'HE',
  Missiles: 'HE',
  MammothTusk: 'HE',
  Hellfire: 'HE',
  OrcaBomb: 'HE',
  RocketLauncher: 'HE',
  CarpetBomb: 'HE',
  TacLaser: 'Laser',
  NodLaser: 'Laser',
  FlameGun: 'Fire',
  NapalmBomb: 'Fire',
  TiberiumAutoRifle: 'Tiberium',
  TiberiumSpray: 'Tiberium',
  ChemMissile: 'ChemSpray',
  SonicWave: 'Sonic',
  AssaultCannon: 'AP',
  Vulcan: 'SA',
  HarpyGun: 'SA',
  BansheeGun: 'AP',
};

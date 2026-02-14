export interface UnitImagePrompt {
  unitId: string;
  unitName: string;
  faction: string;
  category: string;
  prompt: string;
}

const FACTION_DESC: Record<string, string> = {
  GDI: 'blue military GDI armor and insignia',
  Nod: 'red and black Nod Brotherhood colors',
  Mutant: 'toxic green Tiberium mutation effects',
  Forgotten: 'amber and gray mutant faction colors',
  Neutral: 'neutral gray military colors',
};

const CATEGORY_DESC: Record<string, string> = {
  Infantry: 'soldier infantry unit',
  Vehicle: 'armored vehicle war machine',
  Aircraft: 'military aircraft',
  Structure: 'military structure building',
};

export function generateUnitPrompt(unit: {
  name: string;
  faction: string;
  category: string;
}): string {
  const faction = FACTION_DESC[unit.faction] || 'military';
  const category = CATEGORY_DESC[unit.category] || 'military unit';
  return `Command & Conquer Tiberian Sun style unit icon: ${unit.name}, ${category}, ${faction}, pixel art style, isometric 3/4 view angle, standing on Tiberium wasteland with glowing blue crystals in background, futuristic cityscape silhouette, metallic frame border, high contrast, clean details, professional game sprite art, 1024x1024 pixels`;
}

export const PPM_UNIT_PROMPTS: UnitImagePrompt[] = [
  {
    unitId: 'ZOMBIE',
    unitName: 'Zombie',
    faction: 'Mutant',
    category: 'Infantry',
    prompt:
      'Command & Conquer Tiberian Sun style unit icon: Zombie mutant soldier, decaying infected infantry, toxic green Tiberium mutation, rotting flesh and glowing green crystals, pixel art style, isometric 3/4 view, Tiberium wasteland background with blue crystals, horror aesthetic, metallic frame, 1024x1024 pixels',
  },
  {
    unitId: 'HGRUNT',
    unitName: 'Heavy Grunt',
    faction: 'GDI',
    category: 'Infantry',
    prompt:
      'Command & Conquer Tiberian Sun style unit icon: Heavy Grunt soldier, elite GDI infantry in blue tactical armor, assault rifle and tactical gear, military professional, pixel art style, isometric 3/4 view, Tiberium wasteland background, metallic frame, 1024x1024 pixels',
  },
  {
    unitId: 'MASSN',
    unitName: 'Male Assassin',
    faction: 'Nod',
    category: 'Infantry',
    prompt:
      'Command & Conquer Tiberian Sun style unit icon: Male Assassin, Nod stealth operative in black and red outfit, silenced pistol, covert infiltrator, pixel art style, isometric 3/4 view, Tiberium wasteland background, shadowy aesthetic, metallic frame, 1024x1024 pixels',
  },
  {
    unitId: 'SPARTAN',
    unitName: 'Spartan Heavy Mech',
    faction: 'GDI',
    category: 'Vehicle',
    prompt:
      'Command & Conquer Tiberian Sun style unit icon: Spartan Heavy Mech, large blue GDI walker with dual 120mm cannons, heavy combat mech, robotic war machine, pixel art style, isometric 3/4 view, Tiberium wasteland background, imposing presence, metallic frame, 1024x1024 pixels',
  },
  {
    unitId: 'SUBJUGATOR',
    unitName: 'Subjugator Artillery Mech',
    faction: 'Nod',
    category: 'Vehicle',
    prompt:
      'Command & Conquer Tiberian Sun style unit icon: Subjugator Artillery Mech, red Nod walker with quad heavy cannons, siege artillery unit, intimidating war machine, pixel art style, isometric 3/4 view, Tiberium wasteland background, menacing presence, metallic frame, 1024x1024 pixels',
  },
  {
    unitId: 'DEVA',
    unitName: 'Devastator',
    faction: 'GDI',
    category: 'Vehicle',
    prompt:
      'Command & Conquer Tiberian Sun style unit icon: Devastator super-heavy titan, massive blue GDI mega-walker, colossal war machine with heavy plasma weapons, overwhelming scale, pixel art style, isometric 3/4 view, Tiberium wasteland background, epic presence, metallic frame, 1024x1024 pixels',
  },
  {
    unitId: 'REAPER',
    unitName: 'Cyborg Reaper',
    faction: 'Nod',
    category: 'Infantry',
    prompt:
      'Command & Conquer Tiberian Sun style unit icon: Cyborg Reaper, advanced red Nod cyborg soldier, half-human half-machine, plasma rifle, high-tech augmented warrior, pixel art style, isometric 3/4 view, Tiberium wasteland background, cybernetic aesthetic, metallic frame, 1024x1024 pixels',
  },
  {
    unitId: 'SNIPER',
    unitName: 'Sniper',
    faction: 'GDI',
    category: 'Infantry',
    prompt:
      'Command & Conquer Tiberian Sun style unit icon: Sniper, elite blue GDI marksman with long-range precision rifle, ghillie camouflage suit, professional military sharpshooter, pixel art style, isometric 3/4 view, Tiberium wasteland background, tactical aesthetic, metallic frame, 1024x1024 pixels',
  },
  {
    unitId: 'GEIST',
    unitName: 'Geist',
    faction: 'Nod',
    category: 'Infantry',
    prompt:
      'Command & Conquer Tiberian Sun style unit icon: Geist stealth infiltrator, dark Nod armor with cloaking effects, silenced SMG, shadow operative agent, mysterious covert specialist, pixel art style, isometric 3/4 view, Tiberium wasteland background, shadowy aesthetic, metallic frame, 1024x1024 pixels',
  },
  {
    unitId: 'HWR',
    unitName: 'Heavy Weapon Soldier',
    faction: 'GDI',
    category: 'Infantry',
    prompt:
      'Command & Conquer Tiberian Sun style unit icon: Heavy Weapon Soldier, GDI support gunner in blue armor, large heavy machine gun, armored heavy infantry, devastating firepower, pixel art style, isometric 3/4 view, Tiberium wasteland background, military aesthetic, metallic frame, 1024x1024 pixels',
  },
];

export function exportPromptsToText(prompts: UnitImagePrompt[]): string {
  return prompts
    .map(
      (p, i) =>
        `${i + 1}. ${p.unitName} (${p.unitId})\n${p.prompt}\n`
    )
    .join('\n---\n\n');
}

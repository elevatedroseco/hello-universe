import { CustomUnit } from '@/types/units';

interface INISection {
  [key: string]: string;
}

interface ParsedINI {
  [section: string]: INISection;
}

// Track section order for proper serialization
interface ParseResult {
  data: ParsedINI;
  sectionOrder: string[];
}

/**
 * Tiberian Sun INI Parser
 * 
 * Handles the specific INI format used by Command & Conquer: Tiberian Sun.
 * Preserves section order and handles numeric type lists properly.
 */
export class TiberianSunINIParser {
  /**
   * Parse INI text into structured object while preserving section order
   */
  static parse(iniText: string): ParseResult {
    const data: ParsedINI = {};
    const sectionOrder: string[] = [];
    let currentSection = '';

    const lines = iniText.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith(';')) {
        continue;
      }

      // Section header: [SectionName]
      if (trimmed.startsWith('[') && trimmed.includes(']')) {
        const endBracket = trimmed.indexOf(']');
        currentSection = trimmed.slice(1, endBracket);
        if (!data[currentSection]) {
          data[currentSection] = {};
          sectionOrder.push(currentSection);
        }
        continue;
      }

      // Key=Value pair
      if (currentSection && trimmed.includes('=')) {
        const eqIndex = trimmed.indexOf('=');
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        
        // Handle inline comments (value;comment)
        const commentIndex = value.indexOf(';');
        const cleanValue = commentIndex > -1 ? value.slice(0, commentIndex).trim() : value;
        
        data[currentSection][key] = cleanValue;
      }
    }

    return { data, sectionOrder };
  }

  /**
   * Convert parsed INI back to text format
   */
  static stringify(parseResult: ParseResult): string {
    const { data, sectionOrder } = parseResult;
    let output = '';

    // Generate header comment
    output += '; ===============================================\n';
    output += '; Tiberian Sun Rules - Modified by TibSun Mod Kit\n';
    output += `; Generated: ${new Date().toISOString()}\n`;
    output += '; ===============================================\n\n';

    // Process sections in original order
    for (const sectionName of sectionOrder) {
      const section = data[sectionName];
      if (!section) continue;

      output += `[${sectionName}]\n`;

      for (const [key, value] of Object.entries(section)) {
        output += `${key}=${value}\n`;
      }

      output += '\n';
    }

    // Add any new sections not in original order (custom units)
    for (const sectionName of Object.keys(data)) {
      if (!sectionOrder.includes(sectionName)) {
        const section = data[sectionName];
        output += `[${sectionName}]\n`;

        for (const [key, value] of Object.entries(section)) {
          output += `${key}=${value}\n`;
        }

        output += '\n';
      }
    }

    return output;
  }

  /**
   * Find the next available numeric index in a type list section
   */
  static getNextIndex(section: INISection): number {
    const indices = Object.keys(section)
      .filter(k => !isNaN(Number(k)))
      .map(k => parseInt(k, 10));

    return indices.length > 0 ? Math.max(...indices) + 1 : 0;
  }

  /**
   * Inject custom units into appropriate type lists
   */
  static injectUnits(
    parseResult: ParseResult,
    units: CustomUnit[]
  ): ParseResult {
    const { data, sectionOrder } = parseResult;
    const modified = { ...data };

    // Group units by category
    const byCategory = units.reduce((acc, unit) => {
      if (!acc[unit.category]) acc[unit.category] = [];
      acc[unit.category].push(unit);
      return acc;
    }, {} as Record<string, CustomUnit[]>);

    // Map category to type list section name
    const categoryToList: Record<string, string> = {
      'Infantry': 'InfantryTypes',
      'Vehicle': 'VehicleTypes',
      'Aircraft': 'AircraftTypes',
      'Structure': 'BuildingTypes'
    };

    for (const [category, categoryUnits] of Object.entries(byCategory)) {
      const listName = categoryToList[category];
      if (!listName) {
        console.warn(`Unknown category: ${category}`);
        continue;
      }

      // Ensure section exists
      if (!modified[listName]) {
        modified[listName] = {};
        sectionOrder.push(listName);
      }

      // Get next available index
      let nextIndex = this.getNextIndex(modified[listName]);

      // Add each unit to the list
      for (const unit of categoryUnits) {
        const unitName = unit.internalName.toUpperCase();
        modified[listName][nextIndex.toString()] = unitName;
        nextIndex++;
        console.log(`✅ Added ${unitName} to ${listName} at index ${nextIndex - 1}`);
      }
    }

    return { data: modified, sectionOrder };
  }

  /**
   * Add unit definition sections to rules
   */
  static addUnitDefinitions(
    parseResult: ParseResult,
    units: CustomUnit[]
  ): ParseResult {
    const { data, sectionOrder } = parseResult;
    const modified = { ...data };

    for (const unit of units) {
      const rules = (unit.rulesJson || {}) as Record<string, unknown>;
      const unitName = unit.internalName.toUpperCase();

      // Determine owner string - both factions can build by default, or use rulesJson override
      const ownerString = String(rules.Owner || 'GDI,Nod');

      // Determine prerequisite based on category and faction
      let prerequisite: string;
      if (rules.Prerequisite) {
        prerequisite = String(rules.Prerequisite);
      } else if (unit.category === 'Infantry') {
        prerequisite = unit.faction === 'GDI' ? 'GABARR' : 'NAHAND';
      } else if (unit.category === 'Vehicle') {
        prerequisite = unit.faction === 'GDI' ? 'GAWEAP' : 'NAWEAP';
      } else {
        prerequisite = unit.faction === 'GDI' ? 'GAAIRC' : 'NAAIRCR';
      }

      // Determine primary weapon - default to M1Carbine for infantry, 120mm for vehicles
      const defaultWeapon = unit.category === 'Infantry' ? 'M1Carbine' 
        : unit.category === 'Vehicle' ? '120mm' 
        : 'Maverick';
      const primaryWeapon = String(rules.Primary || defaultWeapon);

      // Create unit section with ALL required properties
      modified[unitName] = {
        Name: unit.displayName,
        TechLevel: (rules.TechLevel || unit.techLevel).toString(),
        Owner: ownerString,
        Prerequisite: prerequisite,
        Primary: primaryWeapon,
        Strength: (rules.Strength || unit.strength || 200).toString(),
        Armor: (rules.Armor || (unit.category === 'Infantry' ? 'light' : 'heavy')).toString(),
        Sight: (rules.Sight || 5).toString(),
        Speed: (rules.Speed || unit.speed || 5).toString(),
        Cost: unit.cost.toString(),
        Points: (rules.Points || Math.floor(unit.cost / 20) || 5).toString(),
        Image: unitName,
      };

      // Add secondary weapon if specified
      if (rules.Secondary) {
        modified[unitName].Secondary = String(rules.Secondary);
      }

      // Category-specific attributes
      if (unit.category === 'Infantry') {
        Object.assign(modified[unitName], {
          Category: 'Soldier',
          Pip: 'white',
          Crushable: String(rules.Crushable ?? 'yes'),
          CrushSound: 'InfantrySquish',
          Locomotor: '{4A582741-9839-11d1-B709-00A024DDAFD1}',
          VoiceSelect: '15-I000,15-I004',
          VoiceMove: '15-I006,15-I010',
          VoiceAttack: '15-I020,15-I022'
        });

        if (rules.Elite) {
          modified[unitName].Elite = String(rules.Elite);
        }

      } else if (unit.category === 'Vehicle') {
        Object.assign(modified[unitName], {
          Category: 'AFV',
          Crushable: String(rules.Crushable ?? 'no'),
          Crusher: String(rules.Crusher ?? 'yes'),
          Locomotor: '{4A582742-9839-11d1-B709-00A024DDAFD1}',
        });

        if (rules.Turret !== false) {
          modified[unitName].Turret = 'yes';
        }

      } else if (unit.category === 'Aircraft') {
        Object.assign(modified[unitName], {
          Category: 'AirPower',
          Landable: 'yes',
          Locomotor: '{4A582744-9839-11d1-B709-00A024DDAFD1}',
        });
      }

      // Override locomotor if explicitly set in rulesJson
      if (rules.Locomotor) {
        const locomotors: Record<string, string> = {
          'Foot': '{4A582741-9839-11d1-B709-00A024DDAFD1}',
          'Drive': '{4A582742-9839-11d1-B709-00A024DDAFD1}',
          'Track': '{4A582742-9839-11d1-B709-00A024DDAFD1}',
          'Tracked': '{4A582742-9839-11d1-B709-00A024DDAFD1}',
          'Wheel': '{4A582743-9839-11d1-B709-00A024DDAFD1}',
          'Wheeled': '{4A582743-9839-11d1-B709-00A024DDAFD1}',
          'Fly': '{4A582744-9839-11d1-B709-00A024DDAFD1}',
          'Hover': '{4A582745-9839-11d1-B709-00A024DDAFD1}',
          'Ship': '{55D141B8-DB94-11d1-AC98-006097EBEFEB}',
          'Float': '{55D141B8-DB94-11d1-AC98-006097EBEFEB}'
        };
        modified[unitName].Locomotor = locomotors[rules.Locomotor as string] || locomotors.Foot;
      }

      console.log(`✅ Added unit definition: [${unitName}]`);
    }

    return { data: modified, sectionOrder };
  }

  /**
   * Add art definition sections
   */
  static addArtDefinitions(
    parseResult: ParseResult,
    units: CustomUnit[]
  ): ParseResult {
    const { data, sectionOrder } = parseResult;
    const modified = { ...data };

    for (const unit of units) {
      const art = (unit.artJson || {}) as Record<string, unknown>;
      const unitName = unit.internalName.toUpperCase();
      const iconName = (unitName + 'ICON').substring(0, 8).toUpperCase();

      // Image MUST match the SHP filename (without extension), always uppercase
      modified[unitName] = {
        Image: unitName,
        Cameo: (art.Cameo || iconName).toString()
      };

      if (unit.category === 'Infantry') {
        Object.assign(modified[unitName], {
          Sequence: (art.Sequence || 'InfantrySequence').toString(),
          ActiveAnim: 'Idle',
          Crawler: 'no',
          Remapable: 'yes'
        });
      } else if (unit.category === 'Vehicle') {
        Object.assign(modified[unitName], {
          Voxel: 'no',
          Shadow: 'yes',
          Remapable: 'yes',
          Normalized: 'yes'
        });
      } else if (unit.category === 'Aircraft') {
        Object.assign(modified[unitName], {
          Voxel: 'no',
          Shadow: 'yes',
          Rotors: 'yes',
          PitchSpeed: '0.5'
        });
      }

      modified[unitName].SecondaryFireOffset = '0,0,0';

      console.log(`✅ Added art definition: [${unitName}]`);
    }

    return { data: modified, sectionOrder };
  }
}

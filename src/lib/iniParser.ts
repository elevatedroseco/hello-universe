import { CustomUnit } from '@/types/units';

interface INISection {
  [key: string]: string;
}

interface ParsedINI {
  [section: string]: INISection;
}

// Track section order and raw lines for lossless serialization
interface ParseResult {
  data: ParsedINI;
  sectionOrder: string[];
  rawLines: string[];  // preserve original file verbatim
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

    const rawLines = iniText.split(/\r?\n/);

    for (const line of rawLines) {
      const trimmed = line.trim();

      // Skip empty lines and comments (but they're kept in rawLines)
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

    return { data, sectionOrder, rawLines };
  }

  /**
   * Convert parsed INI back to text format.
   * 
   * FIX 1: TypesList sections are sorted numerically, deduplicated, and re-indexed with no gaps.
   * Existing sections preserve rawLines; only new sections and new keys are appended.
   */
  static stringify(parseResult: ParseResult): string {
    const { data, sectionOrder, rawLines } = parseResult;
    
    // Start with original file content (preserving comments, blank lines, formatting)
    let output = rawLines.join('\n');
    
    // Add mod kit header at the top
    const header = '; ===============================================\n'
      + '; Modified by TibSun Mod Kit\n'
      + `; Generated: ${new Date().toISOString()}\n`
      + '; ===============================================\n\n';
    output = header + output;

    // Append any NEW sections not in original (custom unit definitions)
    for (const sectionName of Object.keys(data)) {
      if (!sectionOrder.includes(sectionName)) {
        const section = data[sectionName];
        output += `\n[${sectionName}]\n`;

        for (const [key, value] of Object.entries(section)) {
          output += `${key}=${value}\n`;
        }
      }
    }

    // Handle modifications to existing sections (new entries in type lists)
    for (const sectionName of sectionOrder) {
      const section = data[sectionName];
      if (!section) continue;
      
      // Collect existing keys from rawLines for this section
      const existingKeys = new Set<string>();
      let inSection = false;
      for (const line of rawLines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('[') && trimmed.includes(']')) {
          const name = trimmed.slice(1, trimmed.indexOf(']'));
          inSection = (name === sectionName);
          continue;
        }
        if (inSection && trimmed.includes('=')) {
          const key = trimmed.slice(0, trimmed.indexOf('=')).trim();
          existingKeys.add(key);
        }
      }
      
      // Check if this is a TypesList (all data keys are numeric)
      const allEntries = Object.entries(section);
      const isTypesList = allEntries.length > 0 && allEntries.every(([k]) => !isNaN(Number(k)));
      
      if (isTypesList) {
        // FIX 1: Deduplicate values, sort numerically, re-index with no gaps
        const valueSet = new Set<string>();
        const dedupedValues: string[] = [];
        
        // Sort by numeric key first
        const sorted = [...allEntries].sort(([a], [b]) => Number(a) - Number(b));
        for (const [, v] of sorted) {
          const val = String(v).trim();
          if (!valueSet.has(val)) {
            valueSet.add(val);
            dedupedValues.push(val);
          }
        }
        
        // Build the replacement block with re-indexed keys
        let listBlock = '';
        dedupedValues.forEach((val, i) => {
          listBlock += `${i}=${val}\n`;
        });
        
        // Replace the entire section content in output
        const sectionHeader = `[${sectionName}]`;
        const sectionIdx = output.indexOf(sectionHeader);
        if (sectionIdx !== -1) {
          const afterHeader = sectionIdx + sectionHeader.length;
          // Find next section or end of file
          const nextSectionMatch = output.substring(afterHeader).search(/^\[/m);
          const sectionEnd = nextSectionMatch !== -1 
            ? afterHeader + nextSectionMatch 
            : output.length;
          
          // Replace everything between [SectionName]\n and next section with our clean list
          const lineBreakAfterHeader = output.indexOf('\n', afterHeader);
          const contentStart = lineBreakAfterHeader !== -1 ? lineBreakAfterHeader + 1 : afterHeader;
          
          output = output.substring(0, contentStart) + listBlock + '\n' + output.substring(sectionEnd);
        }
      } else {
        // Normal section — only append NEW keys
        const newEntries: string[] = [];
        for (const [key, value] of Object.entries(section)) {
          if (!existingKeys.has(key)) {
            newEntries.push(`${key}=${value}`);
          }
        }
        
        if (newEntries.length > 0) {
          const sectionHeader = `[${sectionName}]`;
          const sectionIdx = output.indexOf(sectionHeader);
          if (sectionIdx !== -1) {
            const afterHeader = sectionIdx + sectionHeader.length;
            const nextSectionMatch = output.substring(afterHeader).search(/^\[/m);
            const insertPos = nextSectionMatch !== -1 
              ? afterHeader + nextSectionMatch 
              : output.length;
            
            const insertion = newEntries.join('\n') + '\n';
            output = output.substring(0, insertPos) + insertion + output.substring(insertPos);
          }
        }
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
   * Inject custom units into appropriate type lists.
   * FIX 4: Skips units already present in the list.
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

      // FIX 4: Get existing values to skip duplicates
      const existingValues = new Set(
        Object.entries(modified[listName])
          .filter(([k]) => !isNaN(Number(k)))
          .map(([, v]) => String(v).trim().toUpperCase())
      );

      // Get next available index
      let nextIndex = this.getNextIndex(modified[listName]);

      // Add each unit to the list (skip if already present)
      for (const unit of categoryUnits) {
        const unitName = unit.internalName.toUpperCase();
        
        if (existingValues.has(unitName)) {
          console.log(`⏭️ Skipping ${unitName} — already in ${listName}`);
          continue;
        }

        modified[listName][nextIndex.toString()] = unitName;
        existingValues.add(unitName);
        nextIndex++;
        console.log(`✅ Added ${unitName} to ${listName} at index ${nextIndex - 1}`);
      }
    }

    return { data: modified, sectionOrder, rawLines: parseResult.rawLines };
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

    return { data: modified, sectionOrder, rawLines: parseResult.rawLines };
  }

  /**
   * Add art definition sections.
   * FIX 5: Always includes Cameo= line.
   * FIX 6: Skips units that already have an art block in the base art.ini.
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
      const iconName = (unitName.substring(0, 4) + 'ICON').toUpperCase();
      const isVoxel = unit.renderType === 'VOXEL';

      // FIX 6: Skip if this section already exists in the base art.ini
      if (sectionOrder.includes(unitName)) {
        console.log(`⏭️ Skipping art for ${unitName} — already defined in base art.ini`);
        continue;
      }

      if (isVoxel) {
        // Voxel art block
        const artBlock: INISection = {
          Voxel: 'yes',
          Remapable: 'yes',
          Shadow: 'yes',
          Normalized: 'yes',
          Cameo: String(art.Cameo || iconName),
          PrimaryFireFLH: String(art.PrimaryFireFLH || '0,0,100'),
          SecondaryFireFLH: String(art.SecondaryFireFLH || '0,0,100'),
        };

        if (art.TurretOffset !== undefined) {
          artBlock.TurretOffset = String(art.TurretOffset);
        }
        if (art.Turret === 'yes') {
          artBlock.Turret = 'yes';
        }

        modified[unitName] = artBlock;
      } else {
        // SHP art block (existing logic)
        const artBlock: INISection = {
          Image: unitName,
          Cameo: String(art.Cameo || iconName),
        };

        if (unit.category === 'Infantry') {
          Object.assign(artBlock, {
            Sequence: (art.Sequence || 'InfantrySequence').toString(),
            ActiveAnim: 'Idle',
            Crawler: 'no',
            Remapable: 'yes'
          });
        } else if (unit.category === 'Vehicle') {
          Object.assign(artBlock, {
            Voxel: 'no',
            Shadow: 'yes',
            Remapable: 'yes',
            Normalized: 'yes'
          });
        } else if (unit.category === 'Aircraft') {
          Object.assign(artBlock, {
            Voxel: 'no',
            Shadow: 'yes',
            Rotors: 'yes',
            PitchSpeed: '0.5'
          });
        }

        artBlock.SecondaryFireOffset = '0,0,0';
        modified[unitName] = artBlock;
      }

      console.log(`✅ Added art definition: [${unitName}] (${isVoxel ? 'VOXEL' : 'SHP'})`);
    }

    return { data: modified, sectionOrder, rawLines: parseResult.rawLines };
  }
}

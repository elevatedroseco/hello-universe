import { CustomUnit } from '@/types/units';
import { ORIGINAL_GAME_UNITS } from '@/data/gameUnits';

export interface ValidationResult {
  pass: boolean;
  message?: string;
  suggestion?: string;
  autoFix?: boolean;
  field?: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  severity: 'error' | 'warning' | 'info';
  check: (unit: CustomUnit) => ValidationResult;
}

export interface ValidationIssue {
  unitId: string;
  unitName: string;
  internalName: string;
  rule: string;
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  autoFix?: boolean;
  field?: string;
}

const COMMON_PREREQUISITE_MISTAKES: Record<string, string> = {
  BARRACKS: 'GAPILE (GDI) or NAHAND (Nod)',
  GABARR: 'GAPILE',
  TENT: 'NAHAND',
  REFINERY: 'GAREFN or NAREFN',
  FACTORY: 'GAWEAP or NAWEAP',
};

export const VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'internal-name-format',
    name: 'Internal name format',
    severity: 'error',
    check: (unit) => {
      const name = unit.internalName;
      if (!name || name.trim() === '') {
        return { pass: false, message: 'Internal name is empty.', field: 'internal_name' };
      }
      if (!/^[A-Z0-9]{1,8}$/i.test(name)) {
        return {
          pass: false,
          message: `Invalid internal ID "${name}". Must be A-Z0-9, max 8 chars.`,
          suggestion: name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8),
          autoFix: true,
          field: 'internal_name',
        };
      }
      return { pass: true };
    },
  },
  {
    id: 'name-collision',
    name: 'Base game name collision',
    severity: 'warning',
    check: (unit) => {
      if (ORIGINAL_GAME_UNITS.has(unit.internalName.toUpperCase())) {
        return {
          pass: false,
          message: `"${unit.internalName}" conflicts with a base game unit. This will override the original.`,
          suggestion: unit.internalName.substring(0, 5) + 'X',
        };
      }
      return { pass: true };
    },
  },
  {
    id: 'prerequisite-validity',
    name: 'Prerequisite validation',
    severity: 'error',
    check: (unit) => {
      const rules = (unit.rulesJson || {}) as Record<string, unknown>;
      const prerequisite = String(rules.Prerequisite || '');
      if (!prerequisite) return { pass: true };

      const upper = prerequisite.toUpperCase();
      if (COMMON_PREREQUISITE_MISTAKES[upper]) {
        const faction = unit.faction;
        const suggestion = faction === 'GDI' ? 'GAPILE' : 'NAHAND';
        return {
          pass: false,
          message: `Invalid prerequisite "${prerequisite}". Did you mean: ${COMMON_PREREQUISITE_MISTAKES[upper]}?`,
          suggestion: unit.category === 'Infantry' ? suggestion : (faction === 'GDI' ? 'GAWEAP' : 'NAWEAP'),
          autoFix: true,
          field: 'prerequisite',
        };
      }
      return { pass: true };
    },
  },
  {
    id: 'owner-exists',
    name: 'Owner field required',
    severity: 'error',
    check: (unit) => {
      const rules = (unit.rulesJson || {}) as Record<string, unknown>;
      const owner = String(rules.Owner || '');
      if (!owner || owner.trim() === '') {
        return {
          pass: false,
          message: 'Owner field is required for all units.',
          suggestion: unit.faction || 'GDI',
          autoFix: true,
          field: 'owner',
        };
      }
      return { pass: true };
    },
  },
  {
    id: 'tech-level-valid',
    name: 'Tech level validation',
    severity: 'warning',
    check: (unit) => {
      if (unit.techLevel === -1) {
        return {
          pass: false,
          message: 'TechLevel is -1 (hidden unit). Is this intentional?',
        };
      }
      if (unit.techLevel > 10) {
        return {
          pass: false,
          message: `TechLevel ${unit.techLevel} exceeds maximum (10). Unit will not be buildable.`,
          suggestion: '10',
        };
      }
      return { pass: true };
    },
  },
  {
    id: 'voxel-files-required',
    name: 'Voxel files present',
    severity: 'error',
    check: (unit) => {
      if (unit.renderType === 'VOXEL') {
        if (!unit.voxelFilePath || !unit.hvaFilePath) {
          return {
            pass: false,
            message: 'Voxel units require both VXL and HVA files.',
          };
        }
      }
      return { pass: true };
    },
  },
  {
    id: 'cameo-naming',
    name: 'Cameo naming convention',
    severity: 'info',
    check: (unit) => {
      const art = (unit.artJson || {}) as Record<string, unknown>;
      const expectedCameo = `${unit.internalName.substring(0, 4).toUpperCase()}ICON`;
      const currentCameo = String(art.Cameo || '');
      if (currentCameo && currentCameo !== expectedCameo) {
        return {
          pass: false,
          message: `Cameo name "${currentCameo}" doesn't follow convention. Expected: ${expectedCameo}`,
          suggestion: expectedCameo,
        };
      }
      return { pass: true };
    },
  },
  {
    id: 'cost-zero',
    name: 'Cost is zero',
    severity: 'warning',
    check: (unit) => {
      if (unit.cost <= 0) {
        return {
          pass: false,
          message: 'Unit cost is 0 or negative. It will be free to build.',
        };
      }
      return { pass: true };
    },
  },
  {
    id: 'strength-zero',
    name: 'Strength is zero',
    severity: 'error',
    check: (unit) => {
      if (unit.strength <= 0) {
        return {
          pass: false,
          message: 'Unit strength is 0 or negative. It will die instantly.',
          suggestion: '200',
        };
      }
      return { pass: true };
    },
  },
  {
    id: 'foundation-valid',
    name: 'Foundation validation',
    severity: 'error',
    check: (unit) => {
      if (unit.category === 'Structure') {
        const VALID = ['2x2', '2x3', '3x2', '3x3', '4x2', '4x3', '2x4', '3x4', '5x5'];
        if (!unit.foundation || !VALID.includes(unit.foundation)) {
          return {
            pass: false,
            message: `Invalid or missing foundation "${unit.foundation || 'none'}". Must be one of: ${VALID.join(', ')}`,
            suggestion: '3x2',
          };
        }
      }
      return { pass: true };
    },
  },
];

export function runValidation(units: CustomUnit[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const unit of units) {
    for (const rule of VALIDATION_RULES) {
      const result = rule.check(unit);
      if (!result.pass) {
        issues.push({
          unitId: unit.id,
          unitName: unit.displayName,
          internalName: unit.internalName,
          rule: rule.name,
          ruleId: rule.id,
          severity: rule.severity,
          message: result.message || '',
          suggestion: result.suggestion,
          autoFix: result.autoFix,
          field: result.field,
        });
      }
    }
  }

  return issues;
}

import { describe, it, expect } from 'vitest';
import { VALIDATION_RULES, runValidation } from '../validation';
import { CustomUnit } from '@/types/units';

// ─── Helpers ────────────────────────────────────────────

function makeUnit(overrides: Partial<CustomUnit> = {}): CustomUnit {
  return {
    id: 'u1',
    type: 'custom',
    internalName: 'TUNIT',
    displayName: 'Test',
    faction: 'GDI',
    category: 'Infantry',
    cost: 300,
    strength: 200,
    speed: 4,
    techLevel: 1,
    rulesJson: { Owner: 'GDI' },
    artJson: {},
    ...overrides,
  };
}

function findRule(id: string) {
  return VALIDATION_RULES.find(r => r.id === id)!;
}

// ─── Individual rules ───────────────────────────────────

describe('internal-name-format', () => {
  const rule = findRule('internal-name-format');

  it('passes valid name', () => {
    expect(rule.check(makeUnit({ internalName: 'SNIPER' })).pass).toBe(true);
  });

  it('fails empty name', () => {
    expect(rule.check(makeUnit({ internalName: '' })).pass).toBe(false);
  });

  it('fails name > 8 chars', () => {
    const result = rule.check(makeUnit({ internalName: 'TOOLONGNAME' }));
    expect(result.pass).toBe(false);
    expect(result.suggestion).toBe('TOOLONGN');
    expect(result.autoFix).toBe(true);
  });

  it('fails name with special chars', () => {
    const result = rule.check(makeUnit({ internalName: 'MY-UNIT' }));
    expect(result.pass).toBe(false);
    expect(result.suggestion).toBe('MYUNIT');
  });
});

describe('name-collision', () => {
  const rule = findRule('name-collision');

  it('passes for non-conflicting name', () => {
    expect(rule.check(makeUnit({ internalName: 'MYUNIT' })).pass).toBe(true);
  });

  it('warns for base game collision', () => {
    const result = rule.check(makeUnit({ internalName: 'E1' }));
    expect(result.pass).toBe(false);
  });
});

describe('prerequisite-validity', () => {
  const rule = findRule('prerequisite-validity');

  it('passes valid prerequisite', () => {
    expect(rule.check(makeUnit({ rulesJson: { Prerequisite: 'GAPILE' } })).pass).toBe(true);
  });

  it('fails common mistakes like BARRACKS', () => {
    const result = rule.check(makeUnit({ rulesJson: { Prerequisite: 'BARRACKS', Owner: 'GDI' } }));
    expect(result.pass).toBe(false);
    expect(result.autoFix).toBe(true);
    expect(result.suggestion).toBe('GAPILE');
  });

  it('suggests NAHAND for Nod infantry', () => {
    const result = rule.check(makeUnit({ faction: 'Nod', rulesJson: { Prerequisite: 'BARRACKS', Owner: 'Nod' } }));
    expect(result.suggestion).toBe('NAHAND');
  });
});

describe('owner-exists', () => {
  const rule = findRule('owner-exists');

  it('passes when owner set', () => {
    expect(rule.check(makeUnit({ rulesJson: { Owner: 'GDI' } })).pass).toBe(true);
  });

  it('fails when owner missing', () => {
    const result = rule.check(makeUnit({ rulesJson: {} }));
    expect(result.pass).toBe(false);
    expect(result.autoFix).toBe(true);
  });
});

describe('tech-level-valid', () => {
  const rule = findRule('tech-level-valid');

  it('passes normal tech level', () => {
    expect(rule.check(makeUnit({ techLevel: 3 })).pass).toBe(true);
  });

  it('warns on -1', () => {
    expect(rule.check(makeUnit({ techLevel: -1 })).pass).toBe(false);
  });

  it('warns on > 10', () => {
    expect(rule.check(makeUnit({ techLevel: 15 })).pass).toBe(false);
  });
});

describe('strength-zero', () => {
  const rule = findRule('strength-zero');

  it('passes positive strength', () => {
    expect(rule.check(makeUnit({ strength: 100 })).pass).toBe(true);
  });

  it('fails zero strength', () => {
    expect(rule.check(makeUnit({ strength: 0 })).pass).toBe(false);
  });
});

describe('cost-zero', () => {
  const rule = findRule('cost-zero');

  it('passes positive cost', () => {
    expect(rule.check(makeUnit({ cost: 100 })).pass).toBe(true);
  });

  it('warns on zero cost', () => {
    expect(rule.check(makeUnit({ cost: 0 })).pass).toBe(false);
  });
});

describe('foundation-valid', () => {
  const rule = findRule('foundation-valid');

  it('passes valid foundation for structures', () => {
    expect(rule.check(makeUnit({ category: 'Structure', foundation: '3x2' })).pass).toBe(true);
  });

  it('fails invalid foundation for structures', () => {
    const result = rule.check(makeUnit({ category: 'Structure', foundation: '7x7' }));
    expect(result.pass).toBe(false);
    expect(result.suggestion).toBe('3x2');
  });

  it('passes for non-structure categories (no check)', () => {
    expect(rule.check(makeUnit({ category: 'Infantry' })).pass).toBe(true);
  });
});

describe('voxel-files-required', () => {
  const rule = findRule('voxel-files-required');

  it('passes for SHP units', () => {
    expect(rule.check(makeUnit({ renderType: 'SHP' })).pass).toBe(true);
  });

  it('fails VOXEL without files', () => {
    expect(rule.check(makeUnit({ renderType: 'VOXEL' })).pass).toBe(false);
  });

  it('passes VOXEL with both files', () => {
    expect(rule.check(makeUnit({
      renderType: 'VOXEL',
      voxelFilePath: 'a.vxl',
      hvaFilePath: 'a.hva',
    })).pass).toBe(true);
  });
});

// ─── runValidation() ────────────────────────────────────

describe('runValidation', () => {
  it('returns no issues for a valid unit', () => {
    const issues = runValidation([makeUnit()]);
    expect(issues.length).toBe(0);
  });

  it('returns multiple issues for a bad unit', () => {
    const bad = makeUnit({
      internalName: '',
      strength: 0,
      cost: 0,
      rulesJson: {},
    });
    const issues = runValidation([bad]);
    expect(issues.length).toBeGreaterThanOrEqual(3);
  });

  it('includes unit metadata in issues', () => {
    const bad = makeUnit({ internalName: '', displayName: 'BadUnit' });
    const issues = runValidation([bad]);
    expect(issues[0].unitName).toBe('BadUnit');
  });
});

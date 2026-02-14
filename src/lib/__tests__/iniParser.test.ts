import { describe, it, expect } from 'vitest';
import { TiberianSunINIParser } from '../iniParser';
import { CustomUnit } from '@/types/units';

// ─── Helpers ────────────────────────────────────────────

function makeUnit(overrides: Partial<CustomUnit> = {}): CustomUnit {
  return {
    id: 'test-id',
    type: 'custom',
    internalName: 'TUNIT',
    displayName: 'Test Unit',
    faction: 'GDI',
    category: 'Infantry',
    cost: 300,
    strength: 200,
    speed: 4,
    techLevel: 1,
    rulesJson: {},
    artJson: {},
    ...overrides,
  };
}

const SAMPLE_INI = `; Tiberian Sun Rules
[General]
Name=Tiberian Sun
Version=2.03

[InfantryTypes]
0=E1
1=E2
2=MEDIC

[E1]
Name=Light Infantry
Cost=120
Strength=125
`;

// ─── parse() ────────────────────────────────────────────

describe('TiberianSunINIParser.parse', () => {
  it('parses sections and key-value pairs', () => {
    const result = TiberianSunINIParser.parse(SAMPLE_INI);
    expect(result.data['General'].Name).toBe('Tiberian Sun');
    expect(result.data['General'].Version).toBe('2.03');
    expect(result.data['E1'].Cost).toBe('120');
  });

  it('preserves section order', () => {
    const result = TiberianSunINIParser.parse(SAMPLE_INI);
    expect(result.sectionOrder).toEqual(['General', 'InfantryTypes', 'E1']);
  });

  it('handles inline comments', () => {
    const ini = '[Test]\nKey=Value;this is a comment\n';
    const result = TiberianSunINIParser.parse(ini);
    expect(result.data['Test'].Key).toBe('Value');
  });

  it('skips comment-only and blank lines', () => {
    const ini = '; comment\n\n[S]\nA=1\n';
    const result = TiberianSunINIParser.parse(ini);
    expect(result.sectionOrder).toEqual(['S']);
    expect(result.data['S'].A).toBe('1');
  });

  it('preserves rawLines for lossless round-trip', () => {
    const result = TiberianSunINIParser.parse(SAMPLE_INI);
    expect(result.rawLines.length).toBeGreaterThan(0);
    expect(result.rawLines.join('\n')).toContain('[General]');
  });
});

// ─── getNextIndex() ─────────────────────────────────────

describe('TiberianSunINIParser.getNextIndex', () => {
  it('returns 0 for empty section', () => {
    expect(TiberianSunINIParser.getNextIndex({})).toBe(0);
  });

  it('returns next after highest', () => {
    expect(TiberianSunINIParser.getNextIndex({ '0': 'A', '1': 'B', '5': 'C' })).toBe(6);
  });

  it('ignores non-numeric keys', () => {
    expect(TiberianSunINIParser.getNextIndex({ Name: 'X', '2': 'Y' })).toBe(3);
  });
});

// ─── injectUnits() ──────────────────────────────────────

describe('TiberianSunINIParser.injectUnits', () => {
  it('adds infantry to InfantryTypes', () => {
    const parsed = TiberianSunINIParser.parse(SAMPLE_INI);
    const unit = makeUnit({ internalName: 'SNIPER' });
    const result = TiberianSunINIParser.injectUnits(parsed, [unit]);
    expect(result.data['InfantryTypes']['3']).toBe('SNIPER');
  });

  it('adds vehicle to VehicleTypes (creates section if missing)', () => {
    const parsed = TiberianSunINIParser.parse(SAMPLE_INI);
    const unit = makeUnit({ internalName: 'TANK1', category: 'Vehicle' });
    const result = TiberianSunINIParser.injectUnits(parsed, [unit]);
    expect(result.data['VehicleTypes']['0']).toBe('TANK1');
  });

  it('skips duplicate entries', () => {
    const parsed = TiberianSunINIParser.parse(SAMPLE_INI);
    const unit = makeUnit({ internalName: 'E1' }); // already in list
    const result = TiberianSunINIParser.injectUnits(parsed, [unit]);
    // Should still only have 3 entries (0,1,2)
    const keys = Object.keys(result.data['InfantryTypes']).filter(k => !isNaN(Number(k)));
    expect(keys.length).toBe(3);
  });

  it('maps Structure category to BuildingTypes', () => {
    const parsed = TiberianSunINIParser.parse(SAMPLE_INI);
    const unit = makeUnit({ internalName: 'MYBASE', category: 'Structure' });
    const result = TiberianSunINIParser.injectUnits(parsed, [unit]);
    expect(result.data['BuildingTypes']['0']).toBe('MYBASE');
  });
});

// ─── addUnitDefinitions() ───────────────────────────────

describe('TiberianSunINIParser.addUnitDefinitions', () => {
  it('creates unit section with required fields', () => {
    const parsed = TiberianSunINIParser.parse('');
    const unit = makeUnit();
    const result = TiberianSunINIParser.addUnitDefinitions(parsed, [unit]);
    const def = result.data['TUNIT'];
    expect(def).toBeDefined();
    expect(def.Name).toBe('Test Unit');
    expect(def.Cost).toBe('300');
    expect(def.Owner).toBe('GDI,Nod');
    expect(def.Locomotor).toBe('{4A582741-9839-11d1-B709-00A024DDAFD1}');
  });

  it('adds infantry-specific fields', () => {
    const parsed = TiberianSunINIParser.parse('');
    const unit = makeUnit({ category: 'Infantry' });
    const result = TiberianSunINIParser.addUnitDefinitions(parsed, [unit]);
    expect(result.data['TUNIT'].Category).toBe('Soldier');
    expect(result.data['TUNIT'].Crushable).toBe('yes');
  });

  it('adds vehicle-specific fields', () => {
    const parsed = TiberianSunINIParser.parse('');
    const unit = makeUnit({ category: 'Vehicle' });
    const result = TiberianSunINIParser.addUnitDefinitions(parsed, [unit]);
    expect(result.data['TUNIT'].Category).toBe('AFV');
    expect(result.data['TUNIT'].Crusher).toBe('yes');
    expect(result.data['TUNIT'].Turret).toBe('yes');
  });

  it('adds structure-specific fields', () => {
    const parsed = TiberianSunINIParser.parse('');
    const unit = makeUnit({ category: 'Structure', foundation: '3x2', buildCat: 'GDIBUILDING' });
    const result = TiberianSunINIParser.addUnitDefinitions(parsed, [unit]);
    expect(result.data['TUNIT'].BaseNormal).toBe('yes');
    expect(result.data['TUNIT'].IsBase).toBe('yes');
  });

  it('respects rulesJson overrides for Owner', () => {
    const parsed = TiberianSunINIParser.parse('');
    const unit = makeUnit({ rulesJson: { Owner: 'Nod' } });
    const result = TiberianSunINIParser.addUnitDefinitions(parsed, [unit]);
    expect(result.data['TUNIT'].Owner).toBe('Nod');
  });

  it('maps locomotor names to GUIDs', () => {
    const parsed = TiberianSunINIParser.parse('');
    const unit = makeUnit({ rulesJson: { Locomotor: 'Hover' } });
    const result = TiberianSunINIParser.addUnitDefinitions(parsed, [unit]);
    expect(result.data['TUNIT'].Locomotor).toBe('{4A582745-9839-11d1-B709-00A024DDAFD1}');
  });
});

// ─── addArtDefinitions() ────────────────────────────────

describe('TiberianSunINIParser.addArtDefinitions', () => {
  it('creates SHP infantry art block', () => {
    const parsed = TiberianSunINIParser.parse('');
    const unit = makeUnit({ category: 'Infantry' });
    const result = TiberianSunINIParser.addArtDefinitions(parsed, [unit]);
    const art = result.data['TUNIT'];
    expect(art.Image).toBe('TUNIT');
    expect(art.Cameo).toBe('TUNIICON');
    expect(art.Sequence).toBe('InfantrySequence');
  });

  it('creates voxel art block', () => {
    const parsed = TiberianSunINIParser.parse('');
    const unit = makeUnit({ category: 'Vehicle', renderType: 'VOXEL' });
    const result = TiberianSunINIParser.addArtDefinitions(parsed, [unit]);
    const art = result.data['TUNIT'];
    expect(art.Voxel).toBe('yes');
    expect(art.Shadow).toBe('yes');
  });

  it('skips units already in base art.ini', () => {
    const parsed = TiberianSunINIParser.parse('[TUNIT]\nImage=TUNIT\n');
    const unit = makeUnit();
    const result = TiberianSunINIParser.addArtDefinitions(parsed, [unit]);
    // Should not overwrite the existing block
    expect(result.data['TUNIT'].Image).toBe('TUNIT');
    expect(result.data['TUNIT'].Cameo).toBeUndefined();
  });

  it('creates structure art block with foundation', () => {
    const parsed = TiberianSunINIParser.parse('');
    const unit = makeUnit({ category: 'Structure', foundation: '5x5' });
    const result = TiberianSunINIParser.addArtDefinitions(parsed, [unit]);
    const art = result.data['TUNIT'];
    expect(art.Foundation).toBe('5x5');
    expect(art.NewTheater).toBe('yes');
  });
});

// ─── stringify() (TypesList dedup + re-index) ───────────

describe('TiberianSunINIParser.stringify', () => {
  it('deduplicates and re-indexes type lists', () => {
    const ini = '[InfantryTypes]\n0=E1\n1=E2\n2=E1\n';
    const parsed = TiberianSunINIParser.parse(ini);
    const output = TiberianSunINIParser.stringify(parsed);
    // Should have 0=E1, 1=E2 with no duplicate
    expect(output).toContain('0=E1');
    expect(output).toContain('1=E2');
    // The duplicate E1 at index 2 should be gone
    expect(output).not.toMatch(/2=E1/);
  });

  it('adds mod kit header', () => {
    const parsed = TiberianSunINIParser.parse('[S]\nA=1\n');
    const output = TiberianSunINIParser.stringify(parsed);
    expect(output).toContain('Modified by TibSun Mod Kit');
  });
});

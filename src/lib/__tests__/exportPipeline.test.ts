import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';
import { TiberianSunINIParser } from '../iniParser';
import { buildEcacheMix, MixFileEntry } from '../mixBuilder';
import { runValidation } from '../validation';
import { CustomUnit } from '@/types/units';

// ─── Test Fixtures ──────────────────────────────────────

const makeUnit = (overrides: Partial<CustomUnit> = {}): CustomUnit => ({
  id: 'test-1',
  internalName: 'TSTUNIT',
  displayName: 'Test Unit',
  faction: 'GDI',
  category: 'Infantry',
  cost: 300,
  strength: 200,
  speed: 4,
  techLevel: 2,
  type: 'custom',
  renderType: 'SHP',
  rulesJson: { Owner: 'GDI,Nod' },
  ...overrides,
});

const SHP_INFANTRY = makeUnit();

const VOXEL_VEHICLE = makeUnit({
  id: 'test-2',
  internalName: 'VXTANK',
  displayName: 'Voxel Tank',
  category: 'Vehicle',
  renderType: 'VOXEL',
  cost: 800,
  strength: 400,
  speed: 6,
  techLevel: 3,
  voxelFilePath: 'units/VXTANK.VXL',
  hvaFilePath: 'units/VXTANK.HVA',
});

const NOD_AIRCRAFT = makeUnit({
  id: 'test-3',
  internalName: 'NCRAFT',
  displayName: 'Nod Craft',
  faction: 'Nod',
  category: 'Aircraft',
  cost: 1200,
  strength: 150,
  speed: 12,
  techLevel: 4,
});

const GDI_STRUCTURE = makeUnit({
  id: 'test-4',
  internalName: 'GFORT',
  displayName: 'GDI Fortress',
  category: 'Structure',
  cost: 2500,
  strength: 1000,
  speed: 0,
  techLevel: 5,
  foundation: '3x3',
  power: 50,
  buildCat: 'GDIBUILDING',
});

const ALL_UNITS = [SHP_INFANTRY, VOXEL_VEHICLE, NOD_AIRCRAFT, GDI_STRUCTURE];

// ─── Helpers ────────────────────────────────────────────

const SAMPLE_RULES_INI = `[InfantryTypes]
0=E1
1=E2

[VehicleTypes]
0=TITAN

[AircraftTypes]
0=ORCA

[BuildingTypes]
0=GAPOWR

[E1]
Name=Light Infantry
Cost=120
Strength=125
`;

const SAMPLE_ART_INI = `[E1]
Image=E1
Sequence=InfantrySequence
`;

// ─── Tests ──────────────────────────────────────────────

describe('Export Pipeline E2E', () => {

  // ── 1. Unit selection & validation ──────────────────

  describe('Step 1: Validate selected units', () => {
    it('all fixture units pass validation', () => {
      const issues = runValidation(ALL_UNITS);
      const errors = issues.filter(i => i.severity === 'error');
      // The voxel unit has file paths so it should pass; structure has valid foundation
      expect(errors).toHaveLength(0);
    });

    it('rejects unit with empty internal name', () => {
      const bad = makeUnit({ internalName: '' });
      const issues = runValidation([bad]);
      expect(issues.some(i => i.ruleId === 'internal-name-format')).toBe(true);
    });

    it('warns on base-game name collision', () => {
      const collider = makeUnit({ internalName: 'E1' });
      const issues = runValidation([collider]);
      expect(issues.some(i => i.ruleId === 'name-collision')).toBe(true);
    });
  });

  // ── 2. INI generation ─────────────────────────────

  describe('Step 2: Generate rules.ini', () => {
    it('injects all unit categories into correct TypesLists', () => {
      const parsed = TiberianSunINIParser.parse(SAMPLE_RULES_INI);
      const injected = TiberianSunINIParser.injectUnits(parsed, ALL_UNITS);

      // Infantry list should now contain TSTUNIT
      const infValues = Object.values(injected.data['InfantryTypes']);
      expect(infValues).toContain('TSTUNIT');

      // Vehicle list should contain VXTANK
      const vehValues = Object.values(injected.data['VehicleTypes']);
      expect(vehValues).toContain('VXTANK');

      // Aircraft list should contain NCRAFT
      const airValues = Object.values(injected.data['AircraftTypes']);
      expect(airValues).toContain('NCRAFT');

      // Building list should contain GFORT
      const bldValues = Object.values(injected.data['BuildingTypes']);
      expect(bldValues).toContain('GFORT');
    });

    it('does not duplicate units already in the list', () => {
      const parsed = TiberianSunINIParser.parse(SAMPLE_RULES_INI);
      // Inject twice
      const once = TiberianSunINIParser.injectUnits(parsed, ALL_UNITS);
      const twice = TiberianSunINIParser.injectUnits(once, ALL_UNITS);

      const infValues = Object.values(twice.data['InfantryTypes']);
      const tstCount = infValues.filter(v => v === 'TSTUNIT').length;
      expect(tstCount).toBe(1);
    });

    it('adds unit definition sections with required fields', () => {
      const parsed = TiberianSunINIParser.parse(SAMPLE_RULES_INI);
      const injected = TiberianSunINIParser.injectUnits(parsed, ALL_UNITS);
      const withDefs = TiberianSunINIParser.addUnitDefinitions(injected, ALL_UNITS);

      // Check infantry definition
      expect(withDefs.data['TSTUNIT']).toBeDefined();
      expect(withDefs.data['TSTUNIT'].Name).toBe('Test Unit');
      expect(withDefs.data['TSTUNIT'].Cost).toBe('300');
      expect(withDefs.data['TSTUNIT'].Category).toBe('Soldier');
      expect(withDefs.data['TSTUNIT'].Locomotor).toContain('4A582741');

      // Check vehicle definition
      expect(withDefs.data['VXTANK']).toBeDefined();
      expect(withDefs.data['VXTANK'].Category).toBe('AFV');
      expect(withDefs.data['VXTANK'].Turret).toBe('yes');

      // Check aircraft definition
      expect(withDefs.data['NCRAFT']).toBeDefined();
      expect(withDefs.data['NCRAFT'].Category).toBe('AirPower');
      expect(withDefs.data['NCRAFT'].Landable).toBe('yes');

      // Check structure definition
      expect(withDefs.data['GFORT']).toBeDefined();
      expect(withDefs.data['GFORT'].Power).toBe('50');
      expect(withDefs.data['GFORT'].BaseNormal).toBe('yes');
    });

    it('stringified output contains all unit sections', () => {
      const parsed = TiberianSunINIParser.parse(SAMPLE_RULES_INI);
      const injected = TiberianSunINIParser.injectUnits(parsed, ALL_UNITS);
      const withDefs = TiberianSunINIParser.addUnitDefinitions(injected, ALL_UNITS);
      const output = TiberianSunINIParser.stringify(withDefs);

      expect(output).toContain('[TSTUNIT]');
      expect(output).toContain('[VXTANK]');
      expect(output).toContain('[NCRAFT]');
      expect(output).toContain('[GFORT]');
      expect(output).toContain('Name=Test Unit');
      expect(output).toContain('Name=Voxel Tank');
    });
  });

  // ── 3. Art INI generation ─────────────────────────

  describe('Step 3: Generate art.ini', () => {
    it('generates SHP art block for infantry', () => {
      const parsed = TiberianSunINIParser.parse(SAMPLE_ART_INI);
      const withArt = TiberianSunINIParser.addArtDefinitions(parsed, [SHP_INFANTRY]);

      expect(withArt.data['TSTUNIT']).toBeDefined();
      expect(withArt.data['TSTUNIT'].Image).toBe('TSTUNIT');
      expect(withArt.data['TSTUNIT'].Sequence).toBe('InfantrySequence');
      expect(withArt.data['TSTUNIT'].Cameo).toBe('TSTUICON');
    });

    it('generates Voxel art block for vehicle', () => {
      const parsed = TiberianSunINIParser.parse('');
      const withArt = TiberianSunINIParser.addArtDefinitions(parsed, [VOXEL_VEHICLE]);

      expect(withArt.data['VXTANK']).toBeDefined();
      expect(withArt.data['VXTANK'].Voxel).toBe('yes');
      expect(withArt.data['VXTANK'].Remapable).toBe('yes');
      expect(withArt.data['VXTANK'].PrimaryFireFLH).toBe('0,0,100');
    });

    it('generates structure art block with foundation', () => {
      const parsed = TiberianSunINIParser.parse('');
      const withArt = TiberianSunINIParser.addArtDefinitions(parsed, [GDI_STRUCTURE]);

      expect(withArt.data['GFORT']).toBeDefined();
      expect(withArt.data['GFORT'].Foundation).toBe('3x3');
      expect(withArt.data['GFORT'].NewTheater).toBe('yes');
    });

    it('skips units already defined in base art.ini', () => {
      // E1 is already in SAMPLE_ART_INI
      const existingUnit = makeUnit({ internalName: 'E1' });
      const parsed = TiberianSunINIParser.parse(SAMPLE_ART_INI);
      const withArt = TiberianSunINIParser.addArtDefinitions(parsed, [existingUnit]);

      // E1 should still have the original Image=E1, not be overwritten
      expect(withArt.data['E1'].Image).toBe('E1');
      expect(withArt.data['E1'].Sequence).toBe('InfantrySequence');
      // Should NOT have Cameo added (skipped)
      expect(withArt.data['E1'].Cameo).toBeUndefined();
    });
  });

  // ── 4. MIX building ───────────────────────────────

  describe('Step 4: Build MIX archives', () => {
    const makeFakeFile = (name: string, size: number): MixFileEntry => ({
      name,
      data: new Uint8Array(size).buffer,
    });

    it('builds ecache99.mix with SHP entries', () => {
      const files = [
        makeFakeFile('TSTUNIT.SHP', 1024),
        makeFakeFile('TSTUICON.SHP', 256),
      ];
      const mix = buildEcacheMix(files);

      // Header: 2 bytes filecount + 4 bytes datasize = 6
      // Index: 2 * 12 = 24
      // Data: 1024 + 256 = 1280
      expect(mix.byteLength).toBe(6 + 24 + 1280);

      const view = new DataView(mix.buffer);
      expect(view.getUint16(0, true)).toBe(2);       // file count
      expect(view.getUint32(2, true)).toBe(1280);     // data size
    });

    it('builds expand99.mix with VXL/HVA entries', () => {
      const files = [
        makeFakeFile('VXTANK.VXL', 2048),
        makeFakeFile('VXTANK.HVA', 512),
      ];
      const mix = buildEcacheMix(files);

      expect(mix.byteLength).toBe(6 + 24 + 2560);
      const view = new DataView(mix.buffer);
      expect(view.getUint16(0, true)).toBe(2);
    });

    it('sorts index entries by hash ascending', () => {
      const files = [
        makeFakeFile('ZZZZZ.SHP', 100),
        makeFakeFile('AAAAA.SHP', 100),
        makeFakeFile('MMMMM.SHP', 100),
      ];
      const mix = buildEcacheMix(files);
      const view = new DataView(mix.buffer);

      // Read 3 hashes from index (starting at byte 6)
      const h1 = view.getUint32(6, true);
      const h2 = view.getUint32(18, true);
      const h3 = view.getUint32(30, true);

      expect(h1).toBeLessThanOrEqual(h2);
      expect(h2).toBeLessThanOrEqual(h3);
    });
  });

  // ── 5. ZIP assembly (mod-only mode) ───────────────

  describe('Step 5: Assemble mod-only ZIP', () => {
    it('produces a valid ZIP with rules.ini, art.ini, and MIX', async () => {
      // 1. Generate INI
      const parsed = TiberianSunINIParser.parse(SAMPLE_RULES_INI);
      const injected = TiberianSunINIParser.injectUnits(parsed, [SHP_INFANTRY]);
      const withDefs = TiberianSunINIParser.addUnitDefinitions(injected, [SHP_INFANTRY]);
      const rulesContent = TiberianSunINIParser.stringify(withDefs);

      // 2. Generate Art
      const artParsed = TiberianSunINIParser.parse('');
      const withArt = TiberianSunINIParser.addArtDefinitions(artParsed, [SHP_INFANTRY]);
      let artContent = '';
      for (const [section, entries] of Object.entries(withArt.data)) {
        artContent += `[${section}]\n`;
        for (const [k, v] of Object.entries(entries)) {
          artContent += `${k}=${v}\n`;
        }
        artContent += '\n';
      }

      // 3. Build MIX
      const shpFiles: MixFileEntry[] = [
        { name: 'TSTUNIT.SHP', data: new Uint8Array(512).buffer },
        { name: 'TSTUICON.SHP', data: new Uint8Array(128).buffer },
      ];
      const ecacheMix = buildEcacheMix(shpFiles);

      // 4. Assemble ZIP
      const zip = new JSZip();
      zip.file('rules.ini', rulesContent);
      zip.file('art.ini', artContent);
      zip.file('ecache99.mix', ecacheMix);
      zip.file('MOD_README.txt', 'Test readme');

      const blob = await zip.generateAsync({ type: 'uint8array' });
      expect(blob.byteLength).toBeGreaterThan(0);

      // 5. Verify ZIP contents
      const loaded = await JSZip.loadAsync(blob);
      expect(loaded.file('rules.ini')).not.toBeNull();
      expect(loaded.file('art.ini')).not.toBeNull();
      expect(loaded.file('ecache99.mix')).not.toBeNull();
      expect(loaded.file('MOD_README.txt')).not.toBeNull();

      // 6. Verify rules.ini content inside ZIP
      const rulesInZip = await loaded.file('rules.ini')!.async('string');
      expect(rulesInZip).toContain('[TSTUNIT]');
      expect(rulesInZip).toContain('Name=Test Unit');
      expect(rulesInZip).toContain('Cost=300');

      // 7. Verify art.ini content
      const artInZip = await loaded.file('art.ini')!.async('string');
      expect(artInZip).toContain('[TSTUNIT]');
      expect(artInZip).toContain('Cameo=TSTUICON');

      // 8. Verify MIX is binary and correct size
      const mixInZip = await loaded.file('ecache99.mix')!.async('uint8array');
      expect(mixInZip.byteLength).toBe(6 + 24 + 640);
    });
  });

  // ── 6. Multi-category full pipeline ───────────────

  describe('Step 6: Full pipeline with all unit types', () => {
    it('handles infantry + vehicle + aircraft + structure in one export', async () => {
      // Validate
      const errors = runValidation(ALL_UNITS).filter(i => i.severity === 'error');
      expect(errors).toHaveLength(0);

      // Generate rules
      const parsed = TiberianSunINIParser.parse(SAMPLE_RULES_INI);
      const injected = TiberianSunINIParser.injectUnits(parsed, ALL_UNITS);
      const withDefs = TiberianSunINIParser.addUnitDefinitions(injected, ALL_UNITS);
      const rules = TiberianSunINIParser.stringify(withDefs);

      // Generate art
      const artParsed = TiberianSunINIParser.parse(SAMPLE_ART_INI);
      const withArt = TiberianSunINIParser.addArtDefinitions(artParsed, ALL_UNITS);

      // Build MIX files
      const shpFiles: MixFileEntry[] = [
        { name: 'TSTUNIT.SHP', data: new Uint8Array(512).buffer },
      ];
      const vxlFiles: MixFileEntry[] = [
        { name: 'VXTANK.VXL', data: new Uint8Array(2048).buffer },
        { name: 'VXTANK.HVA', data: new Uint8Array(512).buffer },
      ];

      const ecache = buildEcacheMix(shpFiles);
      const expand = buildEcacheMix(vxlFiles);

      // Assemble ZIP
      const zip = new JSZip();
      zip.file('rules.ini', rules);
      zip.file('ecache99.mix', ecache);
      zip.file('expand99.mix', expand);

      const blob = await zip.generateAsync({ type: 'uint8array' });
      const loaded = await JSZip.loadAsync(blob);

      // Verify all files present
      expect(loaded.file('rules.ini')).not.toBeNull();
      expect(loaded.file('ecache99.mix')).not.toBeNull();
      expect(loaded.file('expand99.mix')).not.toBeNull();

      // Verify rules content has all units
      const rulesOut = await loaded.file('rules.ini')!.async('string');
      expect(rulesOut).toContain('[TSTUNIT]');
      expect(rulesOut).toContain('[VXTANK]');
      expect(rulesOut).toContain('[NCRAFT]');
      expect(rulesOut).toContain('[GFORT]');

      // Verify structure-specific fields
      expect(rulesOut).toContain('Power=50');
      expect(rulesOut).toContain('BaseNormal=yes');

      // Verify aircraft fields
      expect(rulesOut).toContain('Landable=yes');

      // Art has voxel and SHP entries
      expect(withArt.data['VXTANK'].Voxel).toBe('yes');
      expect(withArt.data['TSTUNIT'].Image).toBe('TSTUNIT');
      // E1 was skipped (already in base)
      expect(withArt.data['E1'].Cameo).toBeUndefined();
    });
  });
});

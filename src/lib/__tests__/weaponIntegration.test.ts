import { describe, it, expect, beforeEach } from 'vitest';
import { TiberianSunINIParser } from '../iniParser';
import { CustomUnit } from '@/types/units';
import type { CustomWeapon, CustomWarhead } from '@/pages/WeaponEditor';

// ─── Fixtures ───────────────────────────────────────────

const customWeapon: CustomWeapon = {
  id: 'w1',
  weaponId: 'PLSGUN',
  name: 'Pulse Gun',
  damage: 80,
  rof: 40,
  range: 6,
  projectile: 'Invisible',
  speed: 100,
  warheadId: 'PLSWH',
  report: 'PulseShot',
  anim: '',
};

const customWarhead: CustomWarhead = {
  id: 'wh1',
  warheadId: 'PLSWH',
  name: 'Pulse Warhead',
  verses: '100%,80%,60%,40%,20%',
  spread: 200,
  wall: true,
  wood: false,
  infDeath: 4,
};

const unitWithCustomWeapon: CustomUnit = {
  id: 'u1',
  internalName: 'PLSTRP',
  displayName: 'Pulse Trooper',
  faction: 'GDI',
  category: 'Infantry',
  cost: 450,
  strength: 175,
  speed: 4,
  techLevel: 3,
  type: 'custom',
  renderType: 'SHP',
  rulesJson: {
    Owner: 'GDI',
    Primary: 'PLSGUN',
    Prerequisite: 'GAPILE',
  },
};

const unitWithEliteWeapon: CustomUnit = {
  id: 'u2',
  internalName: 'ELTSLD',
  displayName: 'Elite Soldier',
  faction: 'Nod',
  category: 'Infantry',
  cost: 600,
  strength: 250,
  speed: 4,
  techLevel: 4,
  type: 'custom',
  renderType: 'SHP',
  rulesJson: {
    Owner: 'Nod',
    Primary: 'M1Carbine',
    Secondary: 'PLSGUN',
    Prerequisite: 'NAHAND',
  },
};

const BASE_RULES = `[InfantryTypes]
0=E1

[E1]
Name=Light Infantry
Cost=120
`;

// ─── Helpers ────────────────────────────────────────────

function generateWeaponINI(weapons: CustomWeapon[], warheads: CustomWarhead[]): string {
  let ini = '';
  for (const w of weapons) {
    ini += `[${w.weaponId.toUpperCase()}]\n`;
    ini += `Damage=${w.damage}\n`;
    ini += `ROF=${w.rof}\n`;
    ini += `Range=${w.range}\n`;
    ini += `Projectile=${w.projectile}\n`;
    ini += `Speed=${w.speed}\n`;
    if (w.warheadId) ini += `Warhead=${w.warheadId.toUpperCase()}\n`;
    if (w.report) ini += `Report=${w.report}\n`;
    if (w.anim) ini += `Anim=${w.anim}\n`;
    ini += '\n';
  }
  for (const wh of warheads) {
    ini += `[${wh.warheadId.toUpperCase()}]\n`;
    ini += `Verses=${wh.verses}\n`;
    ini += `Spread=${wh.spread}\n`;
    ini += `Wall=${wh.wall ? 'yes' : 'no'}\n`;
    ini += `Wood=${wh.wood ? 'yes' : 'no'}\n`;
    ini += `InfDeath=${wh.infDeath}\n`;
    ini += '\n';
  }
  return ini;
}

// ─── Tests ──────────────────────────────────────────────

describe('Weapon Forge Integration', () => {

  describe('Custom weapon INI generation', () => {
    it('generates correct weapon block', () => {
      const ini = generateWeaponINI([customWeapon], []);
      expect(ini).toContain('[PLSGUN]');
      expect(ini).toContain('Damage=80');
      expect(ini).toContain('ROF=40');
      expect(ini).toContain('Range=6');
      expect(ini).toContain('Warhead=PLSWH');
      expect(ini).toContain('Report=PulseShot');
    });

    it('generates correct warhead block', () => {
      const ini = generateWeaponINI([], [customWarhead]);
      expect(ini).toContain('[PLSWH]');
      expect(ini).toContain('Verses=100%,80%,60%,40%,20%');
      expect(ini).toContain('Spread=200');
      expect(ini).toContain('Wall=yes');
      expect(ini).toContain('Wood=no');
      expect(ini).toContain('InfDeath=4');
    });

    it('generates both weapon and warhead together', () => {
      const ini = generateWeaponINI([customWeapon], [customWarhead]);
      const parsed = TiberianSunINIParser.parse(ini);
      expect(parsed.data['PLSGUN']).toBeDefined();
      expect(parsed.data['PLSWH']).toBeDefined();
      expect(parsed.data['PLSGUN'].Warhead).toBe('PLSWH');
    });
  });

  describe('Unit references custom weapon in rules.ini', () => {
    it('unit definition includes custom weapon as Primary', () => {
      const parsed = TiberianSunINIParser.parse(BASE_RULES);
      const injected = TiberianSunINIParser.injectUnits(parsed, [unitWithCustomWeapon]);
      const withDefs = TiberianSunINIParser.addUnitDefinitions(injected, [unitWithCustomWeapon]);

      expect(withDefs.data['PLSTRP']).toBeDefined();
      expect(withDefs.data['PLSTRP'].Primary).toBe('PLSGUN');
      expect(withDefs.data['PLSTRP'].Name).toBe('Pulse Trooper');
    });

    it('unit definition includes custom weapon as Secondary/Elite', () => {
      const parsed = TiberianSunINIParser.parse(BASE_RULES);
      const injected = TiberianSunINIParser.injectUnits(parsed, [unitWithEliteWeapon]);
      const withDefs = TiberianSunINIParser.addUnitDefinitions(injected, [unitWithEliteWeapon]);

      expect(withDefs.data['ELTSLD']).toBeDefined();
      expect(withDefs.data['ELTSLD'].Primary).toBe('M1Carbine');
      expect(withDefs.data['ELTSLD'].Secondary).toBe('PLSGUN');
    });

    it('stringified output has weapon reference in unit section', () => {
      const parsed = TiberianSunINIParser.parse(BASE_RULES);
      const injected = TiberianSunINIParser.injectUnits(parsed, [unitWithCustomWeapon]);
      const withDefs = TiberianSunINIParser.addUnitDefinitions(injected, [unitWithCustomWeapon]);
      const output = TiberianSunINIParser.stringify(withDefs);

      expect(output).toContain('[PLSTRP]');
      expect(output).toContain('Primary=PLSGUN');
    });
  });

  describe('Combined unit + weapon INI merging', () => {
    it('final rules.ini contains both weapon definitions and unit referencing them', () => {
      // Simulate what the export pipeline does: merge weapon INI + unit INI
      const weaponBlock = generateWeaponINI([customWeapon], [customWarhead]);

      const parsed = TiberianSunINIParser.parse(BASE_RULES);
      const injected = TiberianSunINIParser.injectUnits(parsed, [unitWithCustomWeapon]);
      const withDefs = TiberianSunINIParser.addUnitDefinitions(injected, [unitWithCustomWeapon]);
      const unitRules = TiberianSunINIParser.stringify(withDefs);

      // Combine: unit rules + weapon definitions
      const combined = unitRules + '\n' + weaponBlock;

      // Parse combined to verify consistency
      const finalParsed = TiberianSunINIParser.parse(combined);

      // Unit exists and references custom weapon
      expect(finalParsed.data['PLSTRP']).toBeDefined();
      expect(finalParsed.data['PLSTRP'].Primary).toBe('PLSGUN');

      // Weapon definition exists
      expect(finalParsed.data['PLSGUN']).toBeDefined();
      expect(finalParsed.data['PLSGUN'].Damage).toBe('80');
      expect(finalParsed.data['PLSGUN'].Warhead).toBe('PLSWH');

      // Warhead definition exists
      expect(finalParsed.data['PLSWH']).toBeDefined();
      expect(finalParsed.data['PLSWH'].Verses).toBe('100%,80%,60%,40%,20%');
    });

    it('multiple units can share the same custom weapon', () => {
      const parsed = TiberianSunINIParser.parse(BASE_RULES);
      const units = [unitWithCustomWeapon, unitWithEliteWeapon];
      const injected = TiberianSunINIParser.injectUnits(parsed, units);
      const withDefs = TiberianSunINIParser.addUnitDefinitions(injected, units);

      // Both units reference PLSGUN
      expect(withDefs.data['PLSTRP'].Primary).toBe('PLSGUN');
      expect(withDefs.data['ELTSLD'].Secondary).toBe('PLSGUN');
    });

    it('weapon with no warhead omits Warhead line', () => {
      const noWarheadWeapon: CustomWeapon = {
        ...customWeapon,
        id: 'w2',
        weaponId: 'RAWGUN',
        warheadId: '',
      };
      const ini = generateWeaponINI([noWarheadWeapon], []);
      expect(ini).toContain('[RAWGUN]');
      expect(ini).not.toContain('Warhead=');
    });

    it('weapon with no report omits Report line', () => {
      const silentWeapon: CustomWeapon = {
        ...customWeapon,
        id: 'w3',
        weaponId: 'SILENT',
        report: '',
      };
      const ini = generateWeaponINI([silentWeapon], []);
      expect(ini).toContain('[SILENT]');
      expect(ini).not.toContain('Report=');
    });
  });
});

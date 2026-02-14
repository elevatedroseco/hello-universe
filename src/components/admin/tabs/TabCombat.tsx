import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { TS_WEAPONS, TS_WARHEADS, TS_ARMOR_TYPES, WEAPON_WARHEAD_MAP } from '@/data/tsWeapons';
import { Heart, Shield, Crosshair, Zap, Wrench } from 'lucide-react';
import type { UnitForm } from '../types';
import type { CustomWeapon, CustomWarhead } from '@/pages/WeaponEditor';

interface TabCombatProps {
  form: UnitForm;
  setForm: React.Dispatch<React.SetStateAction<UnitForm>>;
}

const getStrengthLabel = (v: number) => {
  if (v <= 150) return 'Glass cannon';
  if (v <= 400) return 'Standard';
  if (v <= 800) return 'Heavy unit';
  return 'Boss unit';
};

const getRangeLabel = (v: number) => {
  if (v <= 3) return 'Melee';
  if (v <= 6) return 'Short range';
  if (v <= 10) return 'Medium range';
  return 'Long range / Artillery';
};

const getRofLabel = (v: number) => {
  if (v <= 30) return 'Fast';
  if (v <= 60) return 'Standard';
  return 'Slow';
};

function loadCustomWeapons(): CustomWeapon[] {
  try { return JSON.parse(localStorage.getItem('ts_custom_weapons') || '[]'); }
  catch { return []; }
}

function loadCustomWarheads(): CustomWarhead[] {
  try { return JSON.parse(localStorage.getItem('ts_custom_warheads') || '[]'); }
  catch { return []; }
}

export const TabCombat = ({ form, setForm }: TabCombatProps) => {
  const [weaponSearch, setWeaponSearch] = useState('');

  const customWeapons = useMemo(() => loadCustomWeapons(), []);
  const customWarheads = useMemo(() => loadCustomWarheads(), []);

  const updateField = <K extends keyof UnitForm>(field: K, value: UnitForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const weaponOptions = useMemo(() => {
    const catKey = form.category.toLowerCase() as keyof typeof TS_WEAPONS;
    return TS_WEAPONS[catKey] || TS_WEAPONS.infantry;
  }, [form.category]);

  const filteredWeapons = useMemo(() => {
    if (!weaponSearch) return weaponOptions;
    const q = weaponSearch.toLowerCase();
    return weaponOptions.filter(
      (w) => w.label.toLowerCase().includes(q) || w.id.toLowerCase().includes(q)
    );
  }, [weaponOptions, weaponSearch]);

  const filteredCustomWeapons = useMemo(() => {
    if (!weaponSearch) return customWeapons;
    const q = weaponSearch.toLowerCase();
    return customWeapons.filter(
      (w) => w.name.toLowerCase().includes(q) || w.weaponId.toLowerCase().includes(q)
    );
  }, [customWeapons, weaponSearch]);

  const handleWeaponChange = (weaponId: string) => {
    updateField('primaryWeapon', weaponId);
    const suggested = WEAPON_WARHEAD_MAP[weaponId];
    if (suggested) updateField('warhead', suggested);
  };

  return (
    <div className="p-4 space-y-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3">Weapons</p>

      {/* Primary Weapon */}
      <div className="space-y-2">
        <Label className="text-sm font-display flex items-center gap-1">
          <Crosshair className="w-4 h-4 text-destructive" />
          Primary Weapon
        </Label>
        <Input
          value={weaponSearch}
          onChange={(e) => setWeaponSearch(e.target.value)}
          placeholder="Search weapons..."
          className="bg-secondary border-border text-sm mb-1"
        />
        <Select value={form.primaryWeapon} onValueChange={handleWeaponChange}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Select weapon" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-60">
            <SelectItem value="None">None</SelectItem>
            {filteredWeapons.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{w.label}</span>
                  <Badge variant="outline" className="text-destructive border-destructive/50 text-xs">{w.damage}</Badge>
                  <span className="text-xs text-muted-foreground">{w.targets}</span>
                </span>
              </SelectItem>
            ))}
            {filteredCustomWeapons.length > 0 && (
              <>
                <Separator className="my-1" />
                <div className="px-2 py-1">
                  <span className="text-xs text-muted-foreground font-display flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> CUSTOM WEAPONS
                  </span>
                </div>
                {filteredCustomWeapons.map((w) => (
                  <SelectItem key={`custom-${w.id}`} value={w.weaponId}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{w.name}</span>
                      <Badge variant="outline" className="text-primary border-primary/50 text-xs">{w.damage}</Badge>
                      <span className="text-xs text-muted-foreground">Custom</span>
                    </span>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Elite Weapon */}
      <div className="space-y-2">
        <Label className="text-sm font-display flex items-center gap-1">
          <Zap className="w-4 h-4 text-accent-foreground" />
          Elite Weapon
        </Label>
        <Select value={form.eliteWeapon || 'None'} onValueChange={(v) => updateField('eliteWeapon', v === 'None' ? '' : v)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Same as Primary" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-60">
            <SelectItem value="None">None (keep Primary)</SelectItem>
            {weaponOptions.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{w.label}</span>
                  <Badge variant="outline" className="text-destructive border-destructive/50 text-xs">{w.damage}</Badge>
                </span>
              </SelectItem>
            ))}
            {customWeapons.length > 0 && (
              <>
                <Separator className="my-1" />
                <div className="px-2 py-1">
                  <span className="text-xs text-muted-foreground font-display flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> CUSTOM WEAPONS
                  </span>
                </div>
                {customWeapons.map((w) => (
                  <SelectItem key={`custom-${w.id}`} value={w.weaponId}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{w.name}</span>
                      <Badge variant="outline" className="text-primary border-primary/50 text-xs">{w.damage}</Badge>
                    </span>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Weapon unlocked at Elite veterancy. Leave blank to keep Primary.</p>
      </div>

      {/* Warhead */}
      <div className="space-y-2">
        <Label className="text-sm font-display">Warhead</Label>
        <Select value={form.warhead} onValueChange={(v) => updateField('warhead', v)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {TS_WARHEADS.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                <span className="flex flex-col">
                  <span className="font-medium">{w.label}</span>
                  <span className="text-xs text-muted-foreground">{w.description}</span>
                </span>
              </SelectItem>
            ))}
            {customWarheads.length > 0 && (
              <>
                <Separator className="my-1" />
                <div className="px-2 py-1">
                  <span className="text-xs text-muted-foreground font-display flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> CUSTOM WARHEADS
                  </span>
                </div>
                {customWarheads.map((wh) => (
                  <SelectItem key={`custom-${wh.id}`} value={wh.warheadId}>
                    <span className="flex flex-col">
                      <span className="font-medium">{wh.name}</span>
                      <span className="text-xs text-muted-foreground">Verses: {wh.verses}</span>
                    </span>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3 pt-2">Durability</p>

      {/* Strength */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-display flex items-center gap-1">
            <Heart className="w-4 h-4 text-destructive" />
            Strength (HP)
          </Label>
          <span className="text-sm font-mono text-destructive">{form.strength}</span>
        </div>
        <Slider
          value={[form.strength]}
          onValueChange={([v]) => updateField('strength', v)}
          min={50}
          max={2000}
          step={25}
        />
        <p className="text-xs text-muted-foreground font-mono">{getStrengthLabel(form.strength)}</p>
      </div>

      {/* Armor */}
      <div className="space-y-2">
        <Label className="text-sm font-display flex items-center gap-1">
          <Shield className="w-4 h-4 text-gdi-blue" />
          Armor Type
        </Label>
        <Select value={form.armor} onValueChange={(v) => updateField('armor', v)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {TS_ARMOR_TYPES.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <span className="flex flex-col">
                  <span className="font-medium">{a.label}</span>
                  <span className="text-xs text-muted-foreground">{a.description}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3 pt-2">Fire Control</p>

      {/* ROF */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-display">Rate of Fire</Label>
          <span className="text-sm font-mono">{form.rof}</span>
        </div>
        <Slider
          value={[form.rof]}
          onValueChange={([v]) => updateField('rof', v)}
          min={1}
          max={100}
          step={1}
        />
        <p className="text-xs text-muted-foreground font-mono">{getRofLabel(form.rof)} — Higher = slower. Default infantry ≈ 45</p>
      </div>

      {/* Range */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-display">Range (cells)</Label>
          <span className="text-sm font-mono">{form.range}</span>
        </div>
        <Slider
          value={[form.range]}
          onValueChange={([v]) => updateField('range', v)}
          min={1}
          max={15}
          step={1}
        />
        <p className="text-xs text-muted-foreground font-mono">{getRangeLabel(form.range)}</p>
      </div>
    </div>
  );
};

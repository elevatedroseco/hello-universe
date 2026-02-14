import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { TS_PREREQUISITES } from '@/data/tsWeapons';
import { cn } from '@/lib/utils';
import { User, Truck, Plane, Building2 } from 'lucide-react';
import type { UnitForm } from '../types';

interface TabGeneralProps {
  form: UnitForm;
  setForm: React.Dispatch<React.SetStateAction<UnitForm>>;
}

const FACTION_STYLES: Record<string, string> = {
  GDI: 'bg-gdi-blue text-white border-transparent',
  Nod: 'bg-nod-red text-white border-transparent',
  Mutant: 'bg-mutant-green text-white border-transparent',
};

const CATEGORY_ICONS = {
  Infantry: User,
  Vehicle: Truck,
  Aircraft: Plane,
  Structure: Building2,
} as const;

const TECH_LABELS: Record<number, string> = {
  1: 'Barracks only',
  2: 'Early game',
  3: 'Tech center required',
  4: 'Mid game',
  5: 'Late game',
  6: 'Advanced',
  7: 'Elite',
  8: 'Superweapon tier',
  9: 'Experimental',
  10: 'Ultimate',
};

export const TabGeneral = ({ form, setForm }: TabGeneralProps) => {
  const updateField = <K extends keyof UnitForm>(field: K, value: UnitForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFactionChange = (faction: string) => {
    const prereqs = TS_PREREQUISITES[faction] || [];
    const defaultPrereq = form.category === 'Infantry'
      ? (faction === 'GDI' ? 'GAPILE' : 'NAHAND')
      : (faction === 'GDI' ? 'GAWEAP' : 'NAWEAP');
    setForm((prev) => ({
      ...prev,
      faction: faction as UnitForm['faction'],
      prerequisite: prereqs.includes(defaultPrereq) ? defaultPrereq : (prereqs[0] || ''),
    }));
  };

  const handleCategoryChange = (category: string) => {
    const cat = category as UnitForm['category'];
    const defaultLocos: Record<string, string> = { Infantry: 'Foot', Vehicle: 'Drive', Aircraft: 'Fly', Structure: 'Foot' };
    const defaultArmor: Record<string, string> = { Infantry: 'none', Vehicle: 'light', Aircraft: 'light', Structure: 'concrete' };
    setForm((prev) => ({
      ...prev,
      category: cat,
      locomotor: defaultLocos[cat] || 'Foot',
      armor: defaultArmor[cat] || 'none',
      crushable: cat === 'Infantry',
      crusher: false,
      speed: cat === 'Structure' ? 0 : prev.speed,
      sequence: cat === 'Infantry' ? 'InfantrySequence' : 'N/A',
      renderType: cat === 'Structure' ? 'SHP' : prev.renderType,
    }));
  };

  return (
    <div className="p-4 space-y-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3">Identity</p>

      {/* Internal Name */}
      <div className="space-y-1">
        <Label className="text-sm font-display">Internal Name</Label>
        <Input
          value={form.internalName}
          onChange={(e) => updateField('internalName', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
          placeholder="MYUNIT"
          className="font-mono uppercase bg-secondary border-border"
          maxLength={8}
        />
        <p className="text-xs text-muted-foreground">This ID is used in rules.ini and as the .SHP filename</p>
        {form.internalName.length > 0 && form.internalName.length >= 8 && (
          <Badge variant="outline" className="text-yellow-400 border-yellow-400/50 text-xs">
            ⚠️ Max 8 chars for .SHP compatibility
          </Badge>
        )}
      </div>

      {/* Display Name */}
      <div className="space-y-1">
        <Label className="text-sm font-display">Display Name</Label>
        <Input
          value={form.displayName}
          onChange={(e) => updateField('displayName', e.target.value)}
          placeholder="My Custom Unit"
          className="bg-secondary border-border"
        />
        <p className="text-xs text-muted-foreground">Shown in game sidebar</p>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3 pt-2">Faction & Type</p>

      {/* Faction Radio Cards */}
      <div className="space-y-2">
        <Label className="text-sm font-display">Faction</Label>
        <RadioGroup
          value={form.faction}
          onValueChange={handleFactionChange}
          className="flex gap-2"
        >
          {(['GDI', 'Nod', 'Mutant'] as const).map((f) => (
            <div key={f} className="flex items-center">
              <RadioGroupItem value={f} id={`fac-${f}`} className="sr-only" />
              <Label
                htmlFor={`fac-${f}`}
                className={cn(
                  'px-4 py-2 rounded-md cursor-pointer transition-all border-2 font-display text-sm',
                  form.faction === f
                    ? FACTION_STYLES[f]
                    : 'bg-secondary border-border hover:border-primary/50'
                )}
              >
                {f}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Category Radio Cards */}
      <div className="space-y-2">
        <Label className="text-sm font-display">Category</Label>
        <RadioGroup
          value={form.category}
          onValueChange={handleCategoryChange}
          className="flex gap-2"
        >
          {(['Infantry', 'Vehicle', 'Aircraft', 'Structure'] as const).map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            return (
              <div key={cat} className="flex items-center">
                <RadioGroupItem value={cat} id={`cat-${cat}`} className="sr-only" />
                <Label
                  htmlFor={`cat-${cat}`}
                  className={cn(
                    'px-4 py-2 rounded-md cursor-pointer transition-all border-2 flex items-center gap-2 text-sm',
                    form.category === cat
                      ? 'bg-primary text-primary-foreground border-transparent'
                      : 'bg-secondary border-border hover:border-primary/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {cat}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3 pt-2">Economy</p>

      {/* Tech Level */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-display">Tech Level</Label>
          <span className="text-sm font-mono bg-primary/20 text-primary px-2 py-0.5 rounded">{form.techLevel}</span>
        </div>
        <Slider
          value={[form.techLevel]}
          onValueChange={([v]) => updateField('techLevel', v)}
          min={1}
          max={10}
          step={1}
        />
        <p className="text-xs text-muted-foreground font-mono">{TECH_LABELS[form.techLevel] || ''}</p>
      </div>

      {/* Cost */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-display">Cost</Label>
          <span className="text-sm font-mono text-yellow-400">${form.cost}</span>
        </div>
        <Slider
          value={[form.cost]}
          onValueChange={([v]) => {
            updateField('cost', v);
            updateField('points', Math.floor(v / 100));
          }}
          min={100}
          max={3000}
          step={50}
        />
      </div>

      {/* Points (auto) */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-display text-muted-foreground">Points</Label>
          <span className="text-sm font-mono text-muted-foreground">{form.points}</span>
        </div>
        <p className="text-xs text-muted-foreground">Auto-calculated from cost</p>
      </div>
    </div>
  );
};

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TS_LOCOMOTORS } from '@/data/tsWeapons';
import { cn } from '@/lib/utils';
import { Gauge, Eye } from 'lucide-react';
import type { UnitForm } from '../types';

interface TabPhysicsProps {
  form: UnitForm;
  setForm: React.Dispatch<React.SetStateAction<UnitForm>>;
}

const getSpeedLabel = (v: number) => {
  if (v <= 3) return 'Slow (Cyborg)';
  if (v <= 6) return 'Medium (Titan)';
  if (v <= 9) return 'Fast (Wolverine)';
  return 'Very Fast (Attack Buggy)';
};

const getSightLabel = (v: number) => {
  if (v <= 3) return 'Blind';
  if (v <= 5) return 'Normal';
  if (v <= 8) return 'Scout';
  return 'Max';
};

export const TabPhysics = ({ form, setForm }: TabPhysicsProps) => {
  const updateField = <K extends keyof UnitForm>(field: K, value: UnitForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleBool = (field: keyof UnitForm) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field as keyof UnitForm] }));
  };

  return (
    <div className="p-4 space-y-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3">Movement</p>

      {/* Speed */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-display flex items-center gap-1">
            <Gauge className="w-4 h-4 text-cyan-400" />
            Speed
          </Label>
          <span className="text-sm font-mono text-cyan-400">{form.speed}</span>
        </div>
        <Slider
          value={[form.speed]}
          onValueChange={([v]) => updateField('speed', v)}
          min={1}
          max={12}
          step={1}
        />
        <p className="text-xs text-muted-foreground font-mono">{getSpeedLabel(form.speed)}</p>
      </div>

      {/* Sight */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-display flex items-center gap-1">
            <Eye className="w-4 h-4" />
            Sight Range
          </Label>
          <span className="text-sm font-mono">{form.sight}</span>
        </div>
        <Slider
          value={[form.sight]}
          onValueChange={([v]) => updateField('sight', v)}
          min={1}
          max={10}
          step={1}
        />
        <p className="text-xs text-muted-foreground font-mono">{getSightLabel(form.sight)}</p>
      </div>

      {/* Locomotor */}
      <div className="space-y-2">
        <Label className="text-sm font-display">Locomotor</Label>
        <RadioGroup
          value={form.locomotor}
          onValueChange={(v) => updateField('locomotor', v)}
          className="grid grid-cols-2 gap-2"
        >
          {TS_LOCOMOTORS.map((loco) => (
            <div key={loco.id} className="flex items-center">
              <RadioGroupItem value={loco.id} id={`loco-${loco.id}`} className="sr-only" />
              <Label
                htmlFor={`loco-${loco.id}`}
                className={cn(
                  'w-full px-3 py-2 rounded-md cursor-pointer transition-all border text-sm',
                  form.locomotor === loco.id
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'bg-secondary border-border hover:border-primary/50'
                )}
              >
                <span className="font-medium block">{loco.label}</span>
                <span className="text-xs opacity-70">{loco.description}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3 pt-2">Flags</p>

      {/* Conditional checkboxes */}
      {form.locomotor === 'Foot' && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="crushable"
            checked={form.crushable}
            onCheckedChange={() => toggleBool('crushable')}
            className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
          />
          <Label htmlFor="crushable" className="text-sm cursor-pointer">
            Can be crushed by vehicles
          </Label>
        </div>
      )}

      {(form.locomotor === 'Drive' || form.locomotor === 'Wheel') && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="crusher"
            checked={form.crusher}
            onCheckedChange={() => toggleBool('crusher')}
            className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
          />
          <Label htmlFor="crusher" className="text-sm cursor-pointer">
            Can crush infantry
          </Label>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="cloakable"
          checked={form.cloakable}
          onCheckedChange={() => toggleBool('cloakable')}
          className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
        />
        <Label htmlFor="cloakable" className="text-sm cursor-pointer">
          Unit can cloak (stealth)
        </Label>
      </div>
      {form.cloakable && (
        <p className="text-xs text-muted-foreground ml-6">Requires TechLevel ≥ 3 to be balanced</p>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="sensors"
          checked={form.sensors}
          onCheckedChange={() => toggleBool('sensors')}
          className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
        />
        <Label htmlFor="sensors" className="text-sm cursor-pointer">
          Can detect cloaked units
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="fearless"
          checked={form.fearless}
          onCheckedChange={() => toggleBool('fearless')}
          className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
        />
        <Label htmlFor="fearless" className="text-sm cursor-pointer">
          Never panics or retreats
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="tiberiumHeal"
          checked={form.tiberiumHeal}
          onCheckedChange={() => toggleBool('tiberiumHeal')}
          className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
        />
        <Label htmlFor="tiberiumHeal" className="text-sm cursor-pointer">
          Heals in Tiberium fields
        </Label>
      </div>
      {form.tiberiumHeal && (
        <p className="text-xs text-muted-foreground ml-6">Mutant units heal in green Tiberium</p>
      )}
    </div>
  );
};

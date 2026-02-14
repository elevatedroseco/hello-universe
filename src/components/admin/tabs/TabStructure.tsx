import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Zap } from 'lucide-react';
import { FoundationPreview } from '../FoundationPreview';
import type { UnitForm } from '../types';

interface TabStructureProps {
  form: UnitForm;
  setForm: React.Dispatch<React.SetStateAction<UnitForm>>;
}

const FOUNDATIONS = [
  { id: '2x2', label: '2×2 (Small)', desc: 'Pillbox, Silo' },
  { id: '2x3', label: '2×3', desc: 'Component Tower' },
  { id: '3x2', label: '3×2 (Medium)', desc: 'Barracks, Helipad' },
  { id: '3x3', label: '3×3', desc: 'Power Plant, Refinery' },
  { id: '4x2', label: '4×2', desc: 'War Factory entrance' },
  { id: '4x3', label: '4×3 (Large)', desc: 'War Factory' },
  { id: '2x4', label: '2×4', desc: 'Tall structure' },
  { id: '3x4', label: '3×4', desc: 'Large building' },
  { id: '5x5', label: '5×5 (XL)', desc: 'Construction Yard' },
];

const BUILD_CATS = [
  { id: 'GDIBUILDING', label: 'GDI Building' },
  { id: 'NODBUILDING', label: 'Nod Building' },
  { id: 'GDIDEFENSE', label: 'GDI Defense' },
  { id: 'NODDEFENSE', label: 'Nod Defense' },
];

export const TabStructure = ({ form, setForm }: TabStructureProps) => {
  const updateField = <K extends keyof UnitForm>(field: K, value: UnitForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 space-y-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3">
        <Building2 className="w-3.5 h-3.5 inline mr-1" />
        Foundation
      </p>

      <div className="space-y-2">
        <Label className="text-sm font-display">Foundation Size</Label>
        <Select value={form.foundation} onValueChange={(v) => updateField('foundation', v)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {FOUNDATIONS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <span className="flex flex-col">
                  <span className="font-medium">{f.label}</span>
                  <span className="text-xs text-muted-foreground">{f.desc}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-2">
          <FoundationPreview foundation={form.foundation} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-display">Build Category</Label>
        <Select value={form.buildCat} onValueChange={(v) => updateField('buildCat', v)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {BUILD_CATS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3 pt-2">
        <Zap className="w-3.5 h-3.5 inline mr-1" />
        Power
      </p>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-display">Power Output</Label>
          <span className="text-sm font-mono text-mutant-green">+{form.power}</span>
        </div>
        <Slider
          value={[form.power]}
          onValueChange={([v]) => updateField('power', v)}
          min={0}
          max={200}
          step={10}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-display">Power Drain</Label>
          <span className="text-sm font-mono text-destructive">-{form.powerDrain}</span>
        </div>
        <Slider
          value={[form.powerDrain]}
          onValueChange={([v]) => updateField('powerDrain', v)}
          min={0}
          max={200}
          step={10}
        />
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3 pt-2">Flags</p>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-factory"
          checked={form.isFactory}
          onCheckedChange={(v) => updateField('isFactory', !!v)}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <Label htmlFor="is-factory" className="text-sm cursor-pointer">
          Is Factory (produces units)
        </Label>
      </div>
      {form.isFactory && (
        <p className="text-xs text-muted-foreground ml-6">
          Set Factory=InfantryType, VehicleType, or AircraftType in rules.ini
        </p>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="has-bib"
          checked={form.hasBib}
          onCheckedChange={(v) => updateField('hasBib', !!v)}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <Label htmlFor="has-bib" className="text-sm cursor-pointer">
          Has Bib (concrete apron)
        </Label>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3 pt-2">Files</p>

      <div className="space-y-2">
        <Label className="text-sm font-display">Building SHP File</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-modded-gold/50 transition-colors">
          <input
            type="file"
            accept=".shp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setForm((prev) => ({ ...prev, spriteFile: file }));
            }}
            className="hidden"
            id="structure-shp"
          />
          <label htmlFor="structure-shp" className="cursor-pointer">
            <Building2 className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
            {form.spriteFile ? (
              <p className="text-sm text-modded-gold font-mono">{form.spriteFile.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Click to upload building .shp</p>
            )}
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-display">Buildup Animation SHP (optional)</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-modded-gold/50 transition-colors">
          <input
            type="file"
            accept=".shp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setForm((prev) => ({ ...prev, buildupFile: file }));
            }}
            className="hidden"
            id="buildup-shp"
          />
          <label htmlFor="buildup-shp" className="cursor-pointer">
            <Building2 className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
            {form.buildupFile ? (
              <p className="text-sm text-modded-gold font-mono">{form.buildupFile.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Click to upload buildup .shp</p>
            )}
          </label>
        </div>
      </div>

      {/* Icon always needed */}
      <div className="space-y-2">
        <Label className="text-sm font-display">Cameo / Icon .SHP</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-modded-gold/50 transition-colors">
          <input
            type="file"
            accept=".shp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setForm((prev) => ({ ...prev, iconFile: file }));
            }}
            className="hidden"
            id="structure-icon"
          />
          <label htmlFor="structure-icon" className="cursor-pointer">
            <Building2 className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
            {form.iconFile ? (
              <p className="text-sm text-modded-gold font-mono">{form.iconFile.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Click to upload icon .shp</p>
            )}
          </label>
        </div>
      </div>
    </div>
  );
};

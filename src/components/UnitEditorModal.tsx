import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Unit, CustomUnit, Faction, UnitCategory } from '@/types/units';
import { Swords, Settings2, Gauge, Image } from 'lucide-react';

interface UnitEditorModalProps {
  unit: Unit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (unitData: UnitEditorData) => Promise<void>;
  isSaving?: boolean;
}

export interface UnitEditorData {
  // General
  displayName: string;
  internalName: string;
  faction: Faction;
  category: UnitCategory;
  techLevel: number;
  cost: number;
  
  // Combat
  strength: number;
  armor: string;
  primaryWeapon: string;
  secondaryWeapon: string;
  
  // Physics
  speed: number;
  sightRange: number;
  locomotor: string;
  
  // Art (read-only display)
  imageId: string;
  iconId: string;
  
  // Metadata
  isClone: boolean; // True if editing a default unit (creates override)
  originalUnitId?: string;
}

const ARMOR_TYPES = ['none', 'light', 'medium', 'heavy', 'plate', 'special'];
const LOCOMOTOR_TYPES = ['Foot', 'Tracked', 'Wheeled', 'Hover', 'Fly', 'Float'];

export const UnitEditorModal = ({
  unit,
  open,
  onOpenChange,
  onSave,
  isSaving = false,
}: UnitEditorModalProps) => {
  const [formData, setFormData] = useState<UnitEditorData>({
    displayName: '',
    internalName: '',
    faction: 'GDI',
    category: 'Infantry',
    techLevel: 1,
    cost: 0,
    strength: 100,
    armor: 'none',
    primaryWeapon: '',
    secondaryWeapon: '',
    speed: 5,
    sightRange: 5,
    locomotor: 'Foot',
    imageId: '',
    iconId: '',
    isClone: false,
  });

  // Populate form when unit changes
  useEffect(() => {
    if (unit) {
      const isCustom = unit.type === 'custom';
      const customUnit = unit as CustomUnit;
      const rules = customUnit.rulesJson || {};

      setFormData({
        displayName: unit.displayName,
        internalName: unit.internalName,
        faction: unit.faction,
        category: unit.category,
        techLevel: unit.techLevel || 1,
        cost: unit.cost,
        strength: unit.strength,
        armor: (rules.Armor as string) || 'none',
        primaryWeapon: (rules.Primary as string) || '',
        secondaryWeapon: (rules.Secondary as string) || '',
        speed: unit.speed,
        sightRange: (rules.Sight as number) || 5,
        locomotor: (rules.Locomotor as string) || 'Foot',
        imageId: isCustom ? (customUnit.shpFilePath || '') : unit.internalName,
        iconId: isCustom ? (customUnit.cameoFilePath || '') : `${unit.internalName}ICON`,
        isClone: !isCustom, // If editing default unit, it's a clone/override
        originalUnitId: unit.id,
      });
    }
  }, [unit]);

  const handleSave = async () => {
    await onSave(formData);
  };

  const updateField = <K extends keyof UnitEditorData>(
    field: K,
    value: UnitEditorData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!unit) return null;

  const isDefaultUnit = unit.type === 'default';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Edit Unit: {unit.internalName}
            {isDefaultUnit && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded ml-2">
                Creates Override
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="text-xs">
              <Settings2 className="w-3 h-3 mr-1" />
              General
            </TabsTrigger>
            <TabsTrigger value="combat" className="text-xs">
              <Swords className="w-3 h-3 mr-1" />
              Combat
            </TabsTrigger>
            <TabsTrigger value="physics" className="text-xs">
              <Gauge className="w-3 h-3 mr-1" />
              Physics
            </TabsTrigger>
            <TabsTrigger value="art" className="text-xs">
              <Image className="w-3 h-3 mr-1" />
              Art
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="internalName">Internal Name (ID)</Label>
                <Input
                  id="internalName"
                  value={formData.internalName}
                  onChange={(e) => updateField('internalName', e.target.value.toUpperCase())}
                  disabled={isDefaultUnit} // Can't change ID when creating override
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Owner Faction</Label>
                <Select
                  value={formData.faction}
                  onValueChange={(v) => updateField('faction', v as Faction)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GDI">GDI</SelectItem>
                    <SelectItem value="Nod">Nod</SelectItem>
                    <SelectItem value="Mutant">Mutant</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => updateField('category', v as UnitCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Infantry">Infantry</SelectItem>
                    <SelectItem value="Vehicle">Vehicle</SelectItem>
                    <SelectItem value="Aircraft">Aircraft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tech Level: {formData.techLevel}</Label>
              <Slider
                value={[formData.techLevel]}
                onValueChange={([v]) => updateField('techLevel', v)}
                min={-1}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                -1 = Unbuildable, 0 = Always available, 1-10 = Tech tier
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cost: ${formData.cost}</Label>
              <Slider
                value={[formData.cost]}
                onValueChange={([v]) => updateField('cost', v)}
                min={0}
                max={5000}
                step={50}
              />
            </div>
          </TabsContent>

          {/* Combat Tab */}
          <TabsContent value="combat" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Strength (HP): {formData.strength}</Label>
              <Slider
                value={[formData.strength]}
                onValueChange={([v]) => updateField('strength', v)}
                min={1}
                max={1000}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <Label>Armor Type</Label>
              <Select
                value={formData.armor}
                onValueChange={(v) => updateField('armor', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARMOR_TYPES.map((armor) => (
                    <SelectItem key={armor} value={armor}>
                      {armor.charAt(0).toUpperCase() + armor.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryWeapon">Primary Weapon</Label>
                <Input
                  id="primaryWeapon"
                  value={formData.primaryWeapon}
                  onChange={(e) => updateField('primaryWeapon', e.target.value)}
                  placeholder="e.g., Vulcan, Laser"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryWeapon">Secondary Weapon</Label>
                <Input
                  id="secondaryWeapon"
                  value={formData.secondaryWeapon}
                  onChange={(e) => updateField('secondaryWeapon', e.target.value)}
                  placeholder="e.g., Missile"
                />
              </div>
            </div>
          </TabsContent>

          {/* Physics Tab */}
          <TabsContent value="physics" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Speed: {formData.speed}</Label>
              <Slider
                value={[formData.speed]}
                onValueChange={([v]) => updateField('speed', v)}
                min={1}
                max={20}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Sight Range: {formData.sightRange}</Label>
              <Slider
                value={[formData.sightRange]}
                onValueChange={([v]) => updateField('sightRange', v)}
                min={1}
                max={15}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Locomotor</Label>
              <Select
                value={formData.locomotor}
                onValueChange={(v) => updateField('locomotor', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCOMOTOR_TYPES.map((loco) => (
                    <SelectItem key={loco} value={loco}>
                      {loco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Art Tab (Read-only) */}
          <TabsContent value="art" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="imageId">Image/SHP ID</Label>
              <Input
                id="imageId"
                value={formData.imageId}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                The sprite file used for this unit
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="iconId">Icon/Cameo ID</Label>
              <Input
                id="iconId"
                value={formData.iconId}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                The sidebar icon for this unit
              </p>
            </div>

            <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Art assets are managed through the asset browser. To change the
                unit's appearance, upload new SHP files via the Unit Creator.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : isDefaultUnit ? 'Create Override' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

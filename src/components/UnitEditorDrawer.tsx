import { useState, useEffect } from 'react';
import { useUnitSelection } from '@/store/useUnitSelection';
import { Faction, UnitCategory } from '@/types/units';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Sparkles,
  Settings2,
  Swords,
  Gauge,
  Image,
  DollarSign,
  Heart,
  Shield,
  Eye,
  ImageOff,
  Footprints,
  Truck,
  CircleDot,
  Plane,
  Anchor,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
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
  eliteWeapon: string;
  warhead: string;
  // Physics
  speed: number;
  sightRange: number;
  locomotor: string;
  crushable: boolean;
  crusher: boolean;
}

interface UnitEditorDrawerProps {
  onUnitCreated: (input: {
    internalName: string;
    displayName: string;
    faction: Faction;
    category: UnitCategory;
    cost: number;
    strength: number;
    speed: number;
    techLevel?: number;
    armor?: string;
    primaryWeapon?: string;
    secondaryWeapon?: string;
    sightRange?: number;
    locomotor?: string;
    crushable?: boolean;
    crusher?: boolean;
  }) => Promise<unknown>;
  isCreating?: boolean;
}

const ARMOR_TYPES = [
  { value: 'none', label: 'None', description: '0% damage reduction' },
  { value: 'light', label: 'Light', description: '25% reduction' },
  { value: 'medium', label: 'Medium', description: '50% reduction' },
  { value: 'heavy', label: 'Heavy', description: '75% reduction' },
  { value: 'concrete', label: 'Concrete', description: '90% reduction' },
];

const WARHEAD_TYPES = [
  { value: 'AP', label: 'AP', description: 'Armor Piercing' },
  { value: 'HE', label: 'HE', description: 'High Explosive' },
  { value: 'SA', label: 'SA', description: 'Small Arms' },
  { value: 'Laser', label: 'Laser', description: 'Energy Weapon' },
  { value: 'Fire', label: 'Fire', description: 'Incendiary' },
];

const LOCOMOTOR_TYPES = [
  { value: 'Foot', label: 'Infantry', icon: Footprints, description: 'Walks on foot' },
  { value: 'Track', label: 'Tracked', icon: Truck, description: 'Tank treads' },
  { value: 'Wheel', label: 'Wheeled', icon: CircleDot, description: 'Fast wheels' },
  { value: 'Fly', label: 'Hover/Air', icon: Plane, description: 'Flying unit' },
  { value: 'Ship', label: 'Amphibious', icon: Anchor, description: 'Water capable' },
];

const COMMON_WEAPONS = [
  'M1Carbine',
  'Vulcan',
  '120mm',
  'Dragon',
  'LaserWeapon',
  'MissileLauncher',
  'TiberiumAutoRifle',
  'FlakCannon',
  'SonicWeapon',
];

const LOCAL_STORAGE_KEY = 'unitEditorDraft';

export const UnitEditorDrawer = ({ onUnitCreated, isCreating }: UnitEditorDrawerProps) => {
  const { isDrawerOpen, setDrawerOpen } = useUnitSelection();

  const getInitialFormData = (): FormData => ({
    displayName: '',
    internalName: '',
    faction: 'GDI',
    category: 'Infantry',
    techLevel: 1,
    cost: 500,
    strength: 150,
    armor: 'light',
    primaryWeapon: '',
    eliteWeapon: '',
    warhead: 'AP',
    speed: 4,
    sightRange: 5,
    locomotor: 'Foot',
    crushable: true,
    crusher: false,
  });

  const [formData, setFormData] = useState<FormData>(getInitialFormData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
        setHasUnsavedChanges(true);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (formData.displayName || formData.internalName) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
      setHasUnsavedChanges(true);
    }
  }, [formData]);

  // Auto-generate internal name from display name
  const handleDisplayNameChange = (value: string) => {
    const autoInternal = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);
    setFormData((prev) => ({
      ...prev,
      displayName: value,
      internalName: prev.internalName || autoInternal,
    }));
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.internalName || !formData.displayName) {
      toast.error('Please fill in Display Name and Internal Name');
      return;
    }

    if (formData.displayName.length < 3 || formData.displayName.length > 50) {
      toast.error('Display Name must be 3-50 characters');
      return;
    }

    try {
      await onUnitCreated({
        internalName: formData.internalName.toUpperCase(),
        displayName: formData.displayName,
        faction: formData.faction,
        category: formData.category,
        cost: formData.cost,
        strength: formData.strength,
        speed: formData.speed,
        techLevel: formData.techLevel,
        armor: formData.armor,
        primaryWeapon: formData.primaryWeapon,
        secondaryWeapon: formData.eliteWeapon,
        sightRange: formData.sightRange,
        locomotor: formData.locomotor,
        crushable: formData.crushable,
        crusher: formData.crusher,
      });

      toast.success(`Unit "${formData.displayName}" created!`);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setDrawerOpen(false);
      setFormData(getInitialFormData());
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error(`Failed to create unit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open && hasUnsavedChanges && formData.displayName) {
      // Draft is auto-saved, just close
    }
    setDrawerOpen(open);
  };

  const getSpeedLabel = (speed: number) => {
    if (speed <= 3) return { label: 'Slow', color: 'text-destructive' };
    if (speed <= 8) return { label: 'Medium', color: 'text-yellow-500' };
    return { label: 'Fast', color: 'text-green-500' };
  };

  const getFactionColor = (faction: Faction) => {
    switch (faction) {
      case 'GDI':
        return 'bg-gdi-blue text-white';
      case 'Nod':
        return 'bg-nod-red text-white';
      case 'Mutant':
        return 'bg-mutant-green text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh] bg-background">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-modded-gold" />
            Create Custom Unit
            {hasUnsavedChanges && formData.displayName && (
              <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded ml-2">
                Draft Saved
              </span>
            )}
          </DrawerTitle>
          <DrawerDescription>
            Configure your custom unit across all tabs, then click Create Unit.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto max-h-[60vh]">
          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-4 bg-secondary">
              <TabsTrigger value="general" className="text-xs font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings2 className="w-3 h-3 mr-1" />
                General
              </TabsTrigger>
              <TabsTrigger value="combat" className="text-xs font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Swords className="w-3 h-3 mr-1" />
                Combat
              </TabsTrigger>
              <TabsTrigger value="physics" className="text-xs font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Gauge className="w-3 h-3 mr-1" />
                Physics
              </TabsTrigger>
              <TabsTrigger value="art" className="text-xs font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Image className="w-3 h-3 mr-1" />
                Art
              </TabsTrigger>
            </TabsList>

            {/* === TAB 1: GENERAL === */}
            <TabsContent value="general" className="space-y-5 mt-4">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="font-display text-sm">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="e.g., Elite Commando"
                  value={formData.displayName}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  className="font-mono-stats"
                />
                <p className="text-xs text-muted-foreground">3-50 characters</p>
              </div>

              {/* Internal Name */}
              <div className="space-y-2">
                <Label htmlFor="internalName" className="font-display text-sm">
                  Internal Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="internalName"
                  placeholder="e.g., ELICOM"
                  value={formData.internalName}
                  onChange={(e) => updateField('internalName', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  className="font-mono-stats uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.displayName && !formData.internalName
                    ? 'Auto-generated from Display Name'
                    : 'Unique ID used in game files'}
                </p>
              </div>

              {/* Faction Radio Group */}
              <div className="space-y-3">
                <Label className="font-display text-sm">Owner Faction</Label>
                <RadioGroup
                  value={formData.faction}
                  onValueChange={(v) => updateField('faction', v as Faction)}
                  className="flex gap-2"
                >
                  {(['GDI', 'Nod', 'Mutant'] as Faction[]).map((faction) => (
                    <div key={faction} className="flex items-center">
                      <RadioGroupItem value={faction} id={`faction-${faction}`} className="sr-only" />
                      <Label
                        htmlFor={`faction-${faction}`}
                        className={cn(
                          'px-4 py-2 rounded-md cursor-pointer transition-all border-2',
                          formData.faction === faction
                            ? getFactionColor(faction) + ' border-transparent'
                            : 'bg-secondary border-border hover:border-primary/50'
                        )}
                      >
                        {faction}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Category Select */}
              <div className="space-y-2">
                <Label className="font-display text-sm">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => updateField('category', v as UnitCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Infantry">🚶 Infantry</SelectItem>
                    <SelectItem value="Vehicle">🚗 Vehicle</SelectItem>
                    <SelectItem value="Aircraft">✈️ Aircraft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tech Level Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="font-display text-sm">Tech Level</Label>
                  <span className="text-sm font-mono-stats bg-primary/20 text-primary px-2 py-0.5 rounded">
                    {formData.techLevel}
                  </span>
                </div>
                <Slider
                  value={[formData.techLevel]}
                  onValueChange={([v]) => updateField('techLevel', v)}
                  min={1}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Unlocks at Tech Level {formData.techLevel}
                </p>
              </div>

              {/* Cost Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="font-display text-sm flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-modded-gold" />
                    Cost
                  </Label>
                  <span className="text-sm font-mono-stats text-modded-gold">${formData.cost}</span>
                </div>
                <Slider
                  value={[formData.cost]}
                  onValueChange={([v]) => updateField('cost', v)}
                  min={0}
                  max={10000}
                  step={50}
                />
              </div>
            </TabsContent>

            {/* === TAB 2: COMBAT === */}
            <TabsContent value="combat" className="space-y-5 mt-4">
              {/* Strength / HP */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="font-display text-sm flex items-center gap-1">
                    <Heart className="w-4 h-4 text-destructive" />
                    Strength (HP)
                  </Label>
                  <span className="text-sm font-mono-stats text-destructive">{formData.strength}</span>
                </div>
                <Slider
                  value={[formData.strength]}
                  onValueChange={([v]) => updateField('strength', v)}
                  min={1}
                  max={10000}
                  step={25}
                  className="[&_[data-orientation=horizontal]>.bg-primary]:bg-destructive"
                />
                {/* Health bar preview */}
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
                    style={{ width: `${Math.min(100, (formData.strength / 1000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Armor Type */}
              <div className="space-y-2">
                <Label className="font-display text-sm flex items-center gap-1">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Armor Type
                </Label>
                <Select
                  value={formData.armor}
                  onValueChange={(v) => updateField('armor', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARMOR_TYPES.map((armor) => (
                      <SelectItem key={armor.value} value={armor.value}>
                        <span className="flex items-center gap-2">
                          {armor.label}
                          <span className="text-xs text-muted-foreground">({armor.description})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Primary Weapon */}
              <div className="space-y-2">
                <Label htmlFor="primaryWeapon" className="font-display text-sm">
                  Primary Weapon
                </Label>
                <Input
                  id="primaryWeapon"
                  placeholder="e.g., M1Carbine, 120mm, LaserWeapon"
                  value={formData.primaryWeapon}
                  onChange={(e) => updateField('primaryWeapon', e.target.value)}
                  list="weapons-list"
                  className="font-mono-stats"
                />
                <datalist id="weapons-list">
                  {COMMON_WEAPONS.map((w) => (
                    <option key={w} value={w} />
                  ))}
                </datalist>
              </div>

              {/* Elite Weapon */}
              <div className="space-y-2">
                <Label htmlFor="eliteWeapon" className="font-display text-sm">
                  Elite Weapon (Veterancy)
                </Label>
                <Input
                  id="eliteWeapon"
                  placeholder="Leave blank to use Primary"
                  value={formData.eliteWeapon}
                  onChange={(e) => updateField('eliteWeapon', e.target.value)}
                  className="font-mono-stats"
                />
                <p className="text-xs text-muted-foreground">
                  Weapon when unit reaches Elite rank
                </p>
              </div>

              {/* Warhead */}
              <div className="space-y-2">
                <Label className="font-display text-sm">Warhead Type</Label>
                <Select
                  value={formData.warhead}
                  onValueChange={(v) => updateField('warhead', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WARHEAD_TYPES.map((wh) => (
                      <SelectItem key={wh.value} value={wh.value}>
                        <span className="flex items-center gap-2">
                          {wh.label}
                          <span className="text-xs text-muted-foreground">- {wh.description}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* === TAB 3: PHYSICS === */}
            <TabsContent value="physics" className="space-y-5 mt-4">
              {/* Speed */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="font-display text-sm flex items-center gap-1">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    Speed
                  </Label>
                  <span className={cn('text-sm font-mono-stats', getSpeedLabel(formData.speed).color)}>
                    {formData.speed} - {getSpeedLabel(formData.speed).label}
                  </span>
                </div>
                <Slider
                  value={[formData.speed]}
                  onValueChange={([v]) => updateField('speed', v)}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              {/* Sight Range */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="font-display text-sm flex items-center gap-1">
                    <Eye className="w-4 h-4 text-purple-400" />
                    Sight Range
                  </Label>
                  <span className="text-sm font-mono-stats text-purple-400">
                    {formData.sightRange} cells
                  </span>
                </div>
                <Slider
                  value={[formData.sightRange]}
                  onValueChange={([v]) => updateField('sightRange', v)}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              {/* Locomotor Radio Cards */}
              <div className="space-y-3">
                <Label className="font-display text-sm">Locomotor (Movement Type)</Label>
                <RadioGroup
                  value={formData.locomotor}
                  onValueChange={(v) => {
                    updateField('locomotor', v);
                    // Auto-adjust crushable/crusher based on locomotor
                    if (v === 'Foot') {
                      updateField('crushable', true);
                      updateField('crusher', false);
                    } else if (v === 'Track' || v === 'Wheel') {
                      updateField('crushable', false);
                    }
                  }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                >
                  {LOCOMOTOR_TYPES.map((loco) => {
                    const Icon = loco.icon;
                    return (
                      <div key={loco.value}>
                        <RadioGroupItem value={loco.value} id={`loco-${loco.value}`} className="sr-only" />
                        <Label
                          htmlFor={`loco-${loco.value}`}
                          className={cn(
                            'flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer transition-all border-2',
                            formData.locomotor === loco.value
                              ? 'bg-primary/20 border-primary'
                              : 'bg-secondary border-border hover:border-primary/50'
                          )}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-display">{loco.label}</span>
                          <span className="text-[10px] text-muted-foreground text-center">{loco.description}</span>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              {/* Crushable Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="crushable"
                  checked={formData.crushable}
                  onCheckedChange={(checked) => updateField('crushable', checked as boolean)}
                  disabled={formData.locomotor !== 'Foot'}
                />
                <Label htmlFor="crushable" className="text-sm">
                  Can be crushed by vehicles
                </Label>
              </div>

              {/* Crusher Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="crusher"
                  checked={formData.crusher}
                  onCheckedChange={(checked) => updateField('crusher', checked as boolean)}
                  disabled={formData.locomotor === 'Foot' || formData.locomotor === 'Fly'}
                />
                <Label htmlFor="crusher" className="text-sm">
                  Can crush infantry
                </Label>
              </div>
            </TabsContent>

            {/* === TAB 4: ART (Read-only) === */}
            <TabsContent value="art" className="space-y-5 mt-4">
              {/* Image / Sprite ID */}
              <div className="space-y-2">
                <Label className="font-display text-sm">Image / Sprite ID</Label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-primary/20 text-primary rounded-md font-mono-stats text-sm">
                    {formData.internalName || 'UNIT'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Generated from Internal Name</p>
              </div>

              {/* Cameo / Icon */}
              <div className="space-y-2">
                <Label className="font-display text-sm">Cameo / Icon ID</Label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-md font-mono-stats text-sm">
                    {formData.internalName || 'UNIT'}icon
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Auto-appends 'icon' suffix</p>
              </div>

              {/* Sequence */}
              <div className="space-y-2">
                <Label className="font-display text-sm">Animation Sequence</Label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-secondary rounded-md font-mono-stats text-sm text-muted-foreground">
                    {formData.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Animation sequence to use</p>
              </div>

              {/* Image Preview Placeholder */}
              <div className="mt-4 p-6 bg-secondary/50 rounded-lg border-2 border-dashed border-border flex flex-col items-center gap-3">
                <ImageOff className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Image preview not available</p>
                <p className="text-xs text-muted-foreground text-center">
                  Upload actual .shp files via game tools after creating the unit
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DrawerFooter className="border-t border-border pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            className="bg-modded-gold hover:bg-modded-gold-glow text-black font-display"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isCreating ? 'CREATING...' : 'CREATE UNIT'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

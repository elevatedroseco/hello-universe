import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Sparkles } from 'lucide-react';

interface FormData {
  internalName: string;
  displayName: string;
  faction: Faction;
  category: UnitCategory;
  cost: number;
  strength: number;
  speed: number;
}

interface UnitCreatorDrawerProps {
  onUnitCreated: (input: {
    internalName: string;
    displayName: string;
    faction: Faction;
    category: UnitCategory;
    cost: number;
    strength: number;
    speed: number;
    techLevel?: number;
    shpFile?: File;
  }) => Promise<unknown>;
  isCreating?: boolean;
}

export const UnitCreatorDrawer = ({ onUnitCreated, isCreating }: UnitCreatorDrawerProps) => {
  const { isDrawerOpen, setDrawerOpen } = useUnitSelection();
  
  const [formData, setFormData] = useState<FormData>({
    internalName: '',
    displayName: '',
    faction: 'GDI',
    category: 'Infantry',
    cost: 500,
    strength: 150,
    speed: 5,
  });

  const [shpFile, setShpFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!formData.internalName || !formData.displayName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await onUnitCreated({
        internalName: formData.internalName,
        displayName: formData.displayName,
        faction: formData.faction,
        category: formData.category,
        cost: formData.cost,
        strength: formData.strength,
        speed: formData.speed,
        techLevel: 1,
        shpFile: shpFile ?? undefined,
      });

      toast.success(`Unit "${formData.displayName}" created!`);
      setDrawerOpen(false);
      
      // Reset form
      setFormData({
        internalName: '',
        displayName: '',
        faction: 'GDI',
        category: 'Infantry',
        cost: 500,
        strength: 150,
        speed: 5,
      });
      setShpFile(null);
    } catch (error) {
      toast.error(`Failed to create unit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setShpFile(file);
    }
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-modded-gold" />
            Create Custom Unit
          </DrawerTitle>
          <DrawerDescription>
            Add a new unit to your mod. Fill in the details below.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Internal Name */}
          <div className="space-y-2">
            <Label htmlFor="internalName">Internal Name</Label>
            <Input
              id="internalName"
              placeholder="MYUNIT (uppercase, no spaces)"
              value={formData.internalName}
              onChange={(e) => setFormData({ ...formData, internalName: e.target.value.toUpperCase().replace(/\s/g, '') })}
              className="font-mono-stats"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="My Custom Unit"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            />
          </div>

          {/* Faction & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Faction</Label>
              <Select
                value={formData.faction}
                onValueChange={(value: Faction) => setFormData({ ...formData, faction: value })}
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
                onValueChange={(value: UnitCategory) => setFormData({ ...formData, category: value })}
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

          {/* Cost Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Cost</Label>
              <span className="text-sm text-modded-gold font-mono-stats">${formData.cost}</span>
            </div>
            <Slider
              value={[formData.cost]}
              onValueChange={(value) => setFormData({ ...formData, cost: value[0] })}
              min={100}
              max={3000}
              step={50}
            />
          </div>

          {/* Strength Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Strength</Label>
              <span className="text-sm text-red-500 font-mono-stats">{formData.strength}</span>
            </div>
            <Slider
              value={[formData.strength]}
              onValueChange={(value) => setFormData({ ...formData, strength: value[0] })}
              min={25}
              max={1000}
              step={25}
            />
          </div>

          {/* Speed Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Speed</Label>
              <span className="text-sm text-cyan-500 font-mono-stats">{formData.speed}</span>
            </div>
            <Slider
              value={[formData.speed]}
              onValueChange={(value) => setFormData({ ...formData, speed: value[0] })}
              min={1}
              max={15}
              step={1}
            />
          </div>

          {/* SHP File Upload */}
          <div className="space-y-2">
            <Label>SHP File (optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-modded-gold/50 transition-colors">
              <input
                type="file"
                accept=".shp"
                onChange={handleFileChange}
                className="hidden"
                id="shp-upload"
              />
              <label htmlFor="shp-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                {shpFile ? (
                  <p className="text-sm text-modded-gold font-mono-stats">{shpFile.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click to upload .shp file
                  </p>
                )}
              </label>
            </div>
          </div>
        </div>

        <DrawerFooter>
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

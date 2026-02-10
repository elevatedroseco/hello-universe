import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageIcon, Upload } from 'lucide-react';
import type { UnitForm } from '../types';

interface TabArtProps {
  form: UnitForm;
  setForm: React.Dispatch<React.SetStateAction<UnitForm>>;
}

const SEQUENCES = [
  { id: 'InfantrySequence', label: 'Infantry Sequence', description: 'Standard human walk/shoot/die' },
  { id: 'CyborgSequence', label: 'Cyborg Sequence', description: 'Cyborg animations' },
  { id: 'ZombieSequence', label: 'Zombie Sequence', description: 'Shambling mutant' },
  { id: 'CommandoSequence', label: 'Commando Sequence', description: 'Commando elite moves' },
];

export const TabArt = ({ form, setForm }: TabArtProps) => {
  const spriteId = form.internalName || 'UNIT';
  const cameoId = (spriteId.substring(0, 4) + 'ICON').toUpperCase();

  const handleSpriteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, spriteFile: file }));
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, iconFile: file }));
    }
  };

  return (
    <div className="p-4 space-y-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3">File References</p>

      {/* Sprite ID */}
      <div className="space-y-1">
        <Label className="text-sm font-display">Sprite ID</Label>
        <Badge className="font-mono text-sm bg-secondary text-foreground">{spriteId}</Badge>
        <p className="text-xs text-muted-foreground">The .SHP file must be named {spriteId}.SHP in game root</p>
      </div>

      {/* Cameo ID */}
      <div className="space-y-1">
        <Label className="text-sm font-display">Cameo / Icon ID</Label>
        <Badge className="font-mono text-sm bg-secondary text-foreground">{cameoId}</Badge>
        <p className="text-xs text-muted-foreground">Sidebar icon must be named {cameoId}.SHP</p>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3 pt-2">Upload Files</p>

      {/* Sprite Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-display">Sprite .SHP File</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-modded-gold/50 transition-colors">
          <input
            type="file"
            accept=".shp"
            onChange={handleSpriteUpload}
            className="hidden"
            id="sprite-upload"
          />
          <label htmlFor="sprite-upload" className="cursor-pointer">
            <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
            {form.spriteFile ? (
              <p className="text-sm text-modded-gold font-mono">{form.spriteFile.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Click to upload sprite .shp</p>
            )}
          </label>
        </div>
      </div>

      {/* Icon Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-display">Icon / Cameo .SHP File</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-modded-gold/50 transition-colors">
          <input
            type="file"
            accept=".shp"
            onChange={handleIconUpload}
            className="hidden"
            id="icon-upload"
          />
          <label htmlFor="icon-upload" className="cursor-pointer">
            <ImageIcon className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
            {form.iconFile ? (
              <p className="text-sm text-modded-gold font-mono">{form.iconFile.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Click to upload icon .shp</p>
            )}
          </label>
        </div>
      </div>

      {/* Sequence (infantry only) */}
      {form.category === 'Infantry' ? (
        <div className="space-y-2">
          <Label className="text-sm font-display">Animation Sequence</Label>
          <Select
            value={form.sequence}
            onValueChange={(v) => setForm((prev) => ({ ...prev, sequence: v }))}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {SEQUENCES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex flex-col">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-xs text-muted-foreground">{s.description}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-sm font-display text-muted-foreground">Animation Sequence</Label>
          <p className="text-xs text-muted-foreground">N/A — Vehicles use frame-based animation</p>
        </div>
      )}
    </div>
  );
};

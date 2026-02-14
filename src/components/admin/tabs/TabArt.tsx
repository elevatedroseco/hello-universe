import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageIcon, Upload, Box, AlertTriangle } from 'lucide-react';
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
  const isVoxel = form.renderType === 'VOXEL';

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

  const handleVxlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setForm((prev) => ({ ...prev, vxlFile: file }));
  };

  const handleHvaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setForm((prev) => ({ ...prev, hvaFile: file }));
  };

  const handleTurretVxlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setForm((prev) => ({ ...prev, turretVxlFile: file }));
  };

  const handleBarrelVxlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setForm((prev) => ({ ...prev, barrelVxlFile: file }));
  };

  return (
    <div className="p-4 space-y-5">
      {/* Render Type Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-display">Render Type</Label>
        <Select
          value={form.renderType}
          onValueChange={(v) => setForm((prev) => ({ ...prev, renderType: v as 'SHP' | 'VOXEL' }))}
        >
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="SHP">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                SHP (Sprite-based)
              </span>
            </SelectItem>
            <SelectItem value="VOXEL">
              <span className="flex items-center gap-2">
                <Box className="w-4 h-4" />
                VOXEL (3D Model)
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {isVoxel
            ? 'Voxel models (.vxl + .hva) for vehicles and aircraft'
            : 'SHP sprites for infantry and some vehicles'}
        </p>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3">File References</p>

      {/* Sprite / Voxel ID */}
      <div className="space-y-1">
        <Label className="text-sm font-display">{isVoxel ? 'Voxel ID' : 'Sprite ID'}</Label>
        <Badge className="font-mono text-sm bg-secondary text-foreground">{spriteId}</Badge>
        <p className="text-xs text-muted-foreground">
          {isVoxel
            ? `The .VXL + .HVA files must be named ${spriteId}.VXL / ${spriteId}.HVA`
            : `The .SHP file must be named ${spriteId}.SHP in game root`}
        </p>
      </div>

      {/* Cameo ID */}
      <div className="space-y-1">
        <Label className="text-sm font-display">Cameo / Icon ID</Label>
        <Badge className="font-mono text-sm bg-secondary text-foreground">{cameoId}</Badge>
        <p className="text-xs text-muted-foreground">Sidebar icon must be named {cameoId}.SHP</p>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3 pt-2">Upload Files</p>

      {isVoxel ? (
        <>
          {/* VXL Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-display">VXL File (required)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-modded-gold/50 transition-colors">
              <input type="file" accept=".vxl" onChange={handleVxlUpload} className="hidden" id="vxl-upload" />
              <label htmlFor="vxl-upload" className="cursor-pointer">
                <Box className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                {form.vxlFile ? (
                  <p className="text-sm text-modded-gold font-mono">{form.vxlFile.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Click to upload .vxl model</p>
                )}
              </label>
            </div>
          </div>

          {/* HVA Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-display">HVA File (required)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-modded-gold/50 transition-colors">
              <input type="file" accept=".hva" onChange={handleHvaUpload} className="hidden" id="hva-upload" />
              <label htmlFor="hva-upload" className="cursor-pointer">
                <Box className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                {form.hvaFile ? (
                  <p className="text-sm text-modded-gold font-mono">{form.hvaFile.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Click to upload .hva animation</p>
                )}
              </label>
            </div>
          </div>

          {/* Validation warning */}
          {!form.vxlFile && !form.hvaFile && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              Voxel units require both VXL and HVA files
            </div>
          )}

          {/* Turret VXL (optional) */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="has-turret"
                checked={form.hasTurret}
                onCheckedChange={(v) => setForm((prev) => ({ ...prev, hasTurret: !!v }))}
                className="data-[state=checked]:bg-modded-gold data-[state=checked]:border-modded-gold"
              />
              <Label htmlFor="has-turret" className="text-sm cursor-pointer">Has Turret</Label>
            </div>
            {form.hasTurret && (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-modded-gold/50 transition-colors">
                <input type="file" accept=".vxl" onChange={handleTurretVxlUpload} className="hidden" id="turret-vxl-upload" />
                <label htmlFor="turret-vxl-upload" className="cursor-pointer">
                  <Box className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                  {form.turretVxlFile ? (
                    <p className="text-sm text-modded-gold font-mono">{form.turretVxlFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Click to upload turret .vxl (optional)</p>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Barrel VXL (optional) */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="has-barrel"
                checked={form.hasBarrel}
                onCheckedChange={(v) => setForm((prev) => ({ ...prev, hasBarrel: !!v }))}
                className="data-[state=checked]:bg-modded-gold data-[state=checked]:border-modded-gold"
              />
              <Label htmlFor="has-barrel" className="text-sm cursor-pointer">Has Barrel</Label>
            </div>
            {form.hasBarrel && (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-modded-gold/50 transition-colors">
                <input type="file" accept=".vxl" onChange={handleBarrelVxlUpload} className="hidden" id="barrel-vxl-upload" />
                <label htmlFor="barrel-vxl-upload" className="cursor-pointer">
                  <Box className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                  {form.barrelVxlFile ? (
                    <p className="text-sm text-modded-gold font-mono">{form.barrelVxlFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Click to upload barrel .vxl (optional)</p>
                  )}
                </label>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground uppercase tracking-wider font-display mb-3 pt-2">Fire Location</p>

          {/* FLH fields */}
          <div className="space-y-2">
            <Label className="text-sm font-display">Primary Fire FLH</Label>
            <Input
              value={form.primaryFireFLH}
              onChange={(e) => setForm((prev) => ({ ...prev, primaryFireFLH: e.target.value }))}
              placeholder="0,0,100"
              className="font-mono bg-secondary border-border text-sm"
            />
            <p className="text-xs text-muted-foreground">Forward, Lateral, Height offset for primary weapon muzzle</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-display">Secondary Fire FLH</Label>
            <Input
              value={form.secondaryFireFLH}
              onChange={(e) => setForm((prev) => ({ ...prev, secondaryFireFLH: e.target.value }))}
              placeholder="0,0,100"
              className="font-mono bg-secondary border-border text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-display">Turret Offset</Label>
            <Input
              type="number"
              value={form.turretOffset}
              onChange={(e) => setForm((prev) => ({ ...prev, turretOffset: Number(e.target.value) }))}
              className="font-mono bg-secondary border-border text-sm"
            />
            <p className="text-xs text-muted-foreground">Vertical offset of turret from body center</p>
          </div>
        </>
      ) : (
        <>
          {/* SHP Sprite Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-display">Sprite .SHP File</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-modded-gold/50 transition-colors">
              <input type="file" accept=".shp" onChange={handleSpriteUpload} className="hidden" id="sprite-upload" />
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
        </>
      )}

      {/* Icon Upload - always needed */}
      <div className="space-y-2">
        <Label className="text-sm font-display">Icon / Cameo .SHP File</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-modded-gold/50 transition-colors">
          <input type="file" accept=".shp" onChange={handleIconUpload} className="hidden" id="icon-upload" />
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

      {/* Sequence (infantry + SHP only) */}
      {form.category === 'Infantry' && !isVoxel ? (
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
          <p className="text-xs text-muted-foreground">
            {isVoxel ? 'N/A — Voxel models use HVA animation' : 'N/A — Vehicles use frame-based animation'}
          </p>
        </div>
      )}
    </div>
  );
};

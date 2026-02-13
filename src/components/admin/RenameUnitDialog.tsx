import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PenLine, AlertTriangle } from 'lucide-react';
import { renameUnit } from '@/lib/renameUnit';
import { ORIGINAL_GAME_UNITS } from '@/data/gameUnits';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ForgeUnit {
  id: string;
  internal_name: string;
  name: string;
  faction: string;
  category: string;
}

interface RenameUnitDialogProps {
  unit: ForgeUnit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenamed?: () => void;
}

export const RenameUnitDialog = ({ unit, open, onOpenChange, onRenamed }: RenameUnitDialogProps) => {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [progress, setProgress] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const nameCollision = newName ? ORIGINAL_GAME_UNITS.has(newName.toUpperCase()) : false;
  const canRename = newName && unit && newName !== unit.internal_name && !isRenaming;

  const handleOpenChange = (v: boolean) => {
    if (!isRenaming) {
      onOpenChange(v);
      if (!v) { setNewName(''); setProgress(null); }
    }
  };

  const handleRename = async () => {
    if (!unit || !canRename) return;
    setIsRenaming(true);
    try {
      await renameUnit(unit.id, unit.internal_name, newName, setProgress);
      toast.success(`Renamed to ${newName}`);
      queryClient.invalidateQueries({ queryKey: ['forge-units'] });
      queryClient.invalidateQueries({ queryKey: ['custom-units'] });
      onRenamed?.();
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rename failed');
    } finally {
      setIsRenaming(false);
    }
  };

  useEffect(() => {
    if (unit && open) setNewName(unit.internal_name);
  }, [unit?.id, open]);

  if (!unit) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-base flex items-center gap-2">
            <PenLine className="w-4 h-4 text-primary" />
            Rename Unit
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Current: <span className="font-mono text-foreground">{unit.internal_name}</span>
        </p>

        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8))}
          placeholder="NEW NAME (max 8 chars)"
          className="font-mono"
        />

        {nameCollision && (
          <Badge variant="outline" className="border-modded-gold text-modded-gold gap-1.5 w-fit">
            <AlertTriangle className="w-3 h-3" />
            Conflicts with base game unit
          </Badge>
        )}

        <div className="bg-secondary/50 rounded-lg p-3 text-xs font-mono space-y-1">
          <p className="text-muted-foreground font-sans font-medium mb-1">Preview:</p>
          <p className="text-destructive">- {unit.internal_name}.SHP</p>
          <p className="text-destructive">- {(unit.internal_name + 'ICON').substring(0, 8)}.SHP</p>
          <p className="text-accent-foreground">+ {newName || '???'}.SHP</p>
          <p className="text-accent-foreground">+ {((newName || '???') + 'ICON').substring(0, 8)}.SHP</p>
        </div>

        {progress && (
          <p className="text-xs text-muted-foreground font-mono">{progress}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1" disabled={isRenaming}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={!canRename} className="flex-1 bg-primary hover:bg-primary/90">
            {isRenaming ? 'Renaming...' : 'Rename'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

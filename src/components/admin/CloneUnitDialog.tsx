import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Search, User, Truck, Plane } from 'lucide-react';
import { defaultUnits } from '@/data/defaultUnits';
import { TS_PREREQUISITES } from '@/data/tsWeapons';
import type { UnitForm } from './types';
import type { DefaultUnit } from '@/types/units';

interface CloneUnitDialogProps {
  onClone: (form: Partial<UnitForm>) => void;
}

const CATEGORY_ICONS = {
  Infantry: User,
  Vehicle: Truck,
  Aircraft: Plane,
} as const;

const FACTION_COLORS: Record<string, string> = {
  GDI: 'bg-gdi-blue/20 text-gdi-blue border-gdi-blue/50',
  Nod: 'bg-nod-red/20 text-nod-red border-nod-red/50',
  Mutant: 'bg-mutant-green/20 text-mutant-green border-mutant-green/50',
};

export const CloneUnitDialog = ({ onClone }: CloneUnitDialogProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [factionFilter, setFactionFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return defaultUnits.filter((u) => {
      if (factionFilter !== 'all' && u.faction !== factionFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        u.internalName.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q)
      );
    });
  }, [search, factionFilter]);

  const handleClone = (unit: DefaultUnit) => {
    const faction = unit.faction as 'GDI' | 'Nod' | 'Mutant';
    const category = unit.category as 'Infantry' | 'Vehicle' | 'Aircraft';

    const prereqs = TS_PREREQUISITES[faction] || [];
    const defaultPrereq =
      category === 'Infantry'
        ? faction === 'GDI'
          ? 'GAPILE'
          : 'NAHAND'
        : faction === 'GDI'
          ? 'GAWEAP'
          : 'NAWEAP';

    const defaultLocos: Record<string, string> = {
      Infantry: 'Foot',
      Vehicle: 'Drive',
      Aircraft: 'Fly',
    };
    const defaultArmor: Record<string, string> = {
      Infantry: 'none',
      Vehicle: 'light',
      Aircraft: 'light',
    };

    const newId = (unit.internalName.substring(0, 5) + 'MOD').toUpperCase();

    onClone({
      internalName: newId,
      displayName: `${unit.displayName} (Custom)`,
      faction,
      category,
      cost: unit.cost,
      strength: unit.strength,
      speed: unit.speed,
      techLevel: unit.techLevel,
      prerequisite: prereqs.includes(defaultPrereq) ? defaultPrereq : prereqs[0] || '',
      locomotor: defaultLocos[category] || 'Foot',
      armor: defaultArmor[category] || 'none',
      crushable: category === 'Infantry',
      crusher: category === 'Vehicle',
      points: Math.floor(unit.cost / 100),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-border">
          <Copy className="w-3.5 h-3.5" />
          Clone Base Unit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Clone Base Unit</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search units..."
              className="pl-8 bg-secondary border-border text-sm"
            />
          </div>
          <Select value={factionFilter} onValueChange={setFactionFilter}>
            <SelectTrigger className="w-32 bg-secondary border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Factions</SelectItem>
              <SelectItem value="GDI">GDI</SelectItem>
              <SelectItem value="Nod">Nod</SelectItem>
              <SelectItem value="Mutant">Mutant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
          {filtered.map((unit) => {
            const Icon = CATEGORY_ICONS[unit.category as keyof typeof CATEGORY_ICONS] || User;
            return (
              <Card
                key={unit.id}
                className="cursor-pointer border-border hover:border-primary/50 transition-colors bg-secondary/50"
                onClick={() => handleClone(unit)}
              >
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">{unit.displayName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${FACTION_COLORS[unit.faction] || ''}`}>
                      {unit.faction}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">{unit.internalName}</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-muted-foreground font-mono">
                    <span>${unit.cost}</span>
                    <span>HP:{unit.strength}</span>
                    <span>SPD:{unit.speed}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
              No matching units
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

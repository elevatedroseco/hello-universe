import { useMemo, useState } from 'react';
import { useUnitSelection, SortBy } from '@/store/useUnitSelection';
import { defaultUnits } from '@/data/defaultUnits';
import { CustomUnit, Unit } from '@/types/units';
import { UnitCard } from './UnitCard';
import { UnitEditorModal, UnitEditorData } from './UnitEditorModal';
import { FilterBar } from './FilterBar';
import { useCustomUnits } from '@/hooks/useCustomUnits';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertTriangle, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface UnitGridProps {
  customUnits?: CustomUnit[];
  isConfigMissing?: boolean;
}

function sortUnits<T extends { techLevel: number; cost: number; strength: number; displayName: string }>(
  units: T[],
  sortBy: SortBy
): T[] {
  return [...units].sort((a, b) => {
    switch (sortBy) {
      case 'cost': return a.cost - b.cost;
      case 'strength': return b.strength - a.strength;
      case 'name': return a.displayName.localeCompare(b.displayName);
      case 'techLevel':
      default: return a.techLevel - b.techLevel;
    }
  });
}

function matchesSearch(unit: { internalName: string; displayName: string }, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return unit.internalName.toLowerCase().includes(q) || unit.displayName.toLowerCase().includes(q);
}

export const UnitGrid = ({ customUnits = [], isConfigMissing = false }: UnitGridProps) => {
  const { activeFaction, activeCategory, searchQuery, sortBy, setSearchQuery, setDrawerOpen } = useUnitSelection();
  const { updateUnit, isUpdating } = useCustomUnits();
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const overrideMap = useMemo(() => {
    const map = new Map<string, CustomUnit>();
    customUnits.forEach(cu => map.set(cu.internalName, cu));
    return map;
  }, [customUnits]);

  const filteredDefaultUnits = useMemo(() => {
    return sortUnits(
      defaultUnits
        .filter(unit => unit.faction === activeFaction && unit.category === activeCategory)
        .filter(unit => matchesSearch(unit, searchQuery)),
      sortBy
    );
  }, [activeFaction, activeCategory, searchQuery, sortBy]);

  const filteredCustomUnits = useMemo(() => {
    return sortUnits(
      customUnits
        .filter(unit => unit.faction === activeFaction && unit.category === activeCategory)
        .filter(unit => matchesSearch(unit, searchQuery)),
      sortBy
    );
  }, [customUnits, activeFaction, activeCategory, searchQuery, sortBy]);

  const totalCount = filteredDefaultUnits.length + filteredCustomUnits.length;

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setEditorOpen(true);
  };

  const handleSaveUnit = async (data: UnitEditorData) => {
    try {
      const isExistingCustom = editingUnit?.type === 'custom';
      await updateUnit({
        id: isExistingCustom ? editingUnit.id : undefined,
        internalName: data.internalName,
        displayName: data.displayName,
        faction: data.faction,
        category: data.category,
        cost: data.cost,
        strength: data.strength,
        speed: data.speed,
        techLevel: data.techLevel,
        armor: data.armor,
        primaryWeapon: data.primaryWeapon,
        secondaryWeapon: data.secondaryWeapon,
        sightRange: data.sightRange,
        locomotor: data.locomotor,
      });
      toast.success(
        isExistingCustom
          ? `${data.displayName} updated successfully!`
          : `Override created for ${data.internalName}!`
      );
      setEditorOpen(false);
      setEditingUnit(null);
    } catch (error) {
      console.error('Failed to save unit:', error);
      toast.error('Failed to save unit changes');
    }
  };

  const noResults = totalCount === 0 && searchQuery;

  return (
    <div className="space-y-4">
      {isConfigMissing && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backend not connected</AlertTitle>
          <AlertDescription>
            Please add <span className="font-mono text-xs">VITE_SUPABASE_URL</span> and{' '}
            <span className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</span> to your project settings,
            then refresh the preview.
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Bar */}
      <FilterBar unitCount={totalCount} />

      {/* No results */}
      {noResults ? (
        <div className="text-center py-16 space-y-3">
          <Search className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">
            No results for "<span className="text-foreground">{searchQuery}</span>"
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
            <X className="w-3.5 h-3.5 mr-1" /> Clear search
          </Button>
        </div>
      ) : (
        /* Tabs */
        <Tabs defaultValue="defaults">
          <TabsList className="bg-card/50 border border-border">
            <TabsTrigger value="defaults" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Defaults
            </TabsTrigger>
            <TabsTrigger value="custom" className="font-display text-xs data-[state=active]:bg-modded-gold data-[state=active]:text-black gap-1.5">
              Custom
              {filteredCustomUnits.length > 0 && (
                <Badge className="bg-modded-gold/20 text-modded-gold border-none text-[10px] px-1.5 py-0">
                  {filteredCustomUnits.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="defaults" className="mt-4">
            {filteredDefaultUnits.length > 0 ? (
              <AnimatePresence mode="popLayout">
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  layout
                >
                  {filteredDefaultUnits.map((unit, index) => (
                    <motion.div
                      key={unit.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    >
                      <UnitCard
                        unit={unit}
                        onEdit={handleEditUnit}
                        hasOverride={overrideMap.has(unit.internalName)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No default units for this faction/category
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            {filteredCustomUnits.length > 0 ? (
              <AnimatePresence mode="popLayout">
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  layout
                >
                  {filteredCustomUnits.map((unit, index) => (
                    <motion.div
                      key={unit.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    >
                      <UnitCard unit={unit} onEdit={handleEditUnit} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-lg space-y-3">
                <Sparkles className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground font-medium">
                  {isConfigMissing
                    ? 'Connect your backend to create custom units'
                    : 'Create your first custom unit'}
                </p>
                {!isConfigMissing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDrawerOpen(true)}
                    className="border-modded-gold text-modded-gold hover:bg-modded-gold/10"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Create Unit
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <UnitEditorModal
        unit={editingUnit}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleSaveUnit}
        isSaving={isUpdating}
      />
    </div>
  );
};

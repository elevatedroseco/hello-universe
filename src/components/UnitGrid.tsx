import { useMemo, useState } from 'react';
import { useUnitSelection } from '@/store/useUnitSelection';
import { defaultUnits } from '@/data/defaultUnits';
import { CustomUnit, Unit } from '@/types/units';
import { UnitCard } from './UnitCard';
import { UnitEditorModal, UnitEditorData } from './UnitEditorModal';
import { useCustomUnits } from '@/hooks/useCustomUnits';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface UnitGridProps {
  customUnits?: CustomUnit[];
  isConfigMissing?: boolean;
}

export const UnitGrid = ({ customUnits = [], isConfigMissing = false }: UnitGridProps) => {
  const { activeFaction, activeCategory } = useUnitSelection();
  const { updateUnit, isUpdating } = useCustomUnits();
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  // Build a map of internal names that have custom overrides
  const overrideMap = useMemo(() => {
    const map = new Map<string, CustomUnit>();
    customUnits.forEach(cu => map.set(cu.internalName, cu));
    return map;
  }, [customUnits]);

  // Filter default units by faction and category
  const filteredDefaultUnits = useMemo(() => {
    return defaultUnits
      .filter(unit => unit.faction === activeFaction && unit.category === activeCategory)
      .sort((a, b) => a.techLevel - b.techLevel);
  }, [activeFaction, activeCategory]);

  // Filter custom units by faction and category
  const filteredCustomUnits = useMemo(() => {
    return customUnits.filter(
      unit => unit.faction === activeFaction && unit.category === activeCategory
    );
  }, [customUnits, activeFaction, activeCategory]);

  const hasCustomUnits = filteredCustomUnits.length > 0;

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setEditorOpen(true);
  };

  const handleSaveUnit = async (data: UnitEditorData) => {
    try {
      // Determine if we're updating existing custom unit or creating override
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

  return (
    <div className="space-y-8">
      {/* Config Missing Banner */}
      {isConfigMissing && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Supabase not connected</AlertTitle>
          <AlertDescription>
            Please add <span className="font-mono text-xs">VITE_SUPABASE_URL</span> and{' '}
            <span className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</span> to your project settings,
            then refresh the preview.
          </AlertDescription>
        </Alert>
      )}

      {/* Default Units Section */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4 text-muted-foreground">
          DEFAULT UNITS
        </h2>
        <AnimatePresence mode="popLayout">
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            layout
          >
            {filteredDefaultUnits.map((unit, index) => {
              const hasOverride = overrideMap.has(unit.internalName);
              return (
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <UnitCard 
                    unit={unit} 
                    onEdit={handleEditUnit} 
                    hasOverride={hasOverride}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filteredDefaultUnits.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No default units for this faction/category
          </div>
        )}
      </div>

      {/* Custom Units Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Separator className="flex-1" />
          <div className="flex items-center gap-2 text-modded-gold">
            <Sparkles className="w-4 h-4" />
            <span className="font-display text-sm font-semibold">CUSTOM UNITS</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <Separator className="flex-1" />
        </div>

        {hasCustomUnits ? (
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
                  transition={{ delay: index * 0.05 }}
                >
                  <UnitCard 
                    unit={unit} 
                    onEdit={handleEditUnit}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              No custom units yet. Click the + button to create one!
            </p>
          </div>
        )}
      </div>

      {/* Unit Editor Modal */}
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

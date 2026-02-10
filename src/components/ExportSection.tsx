import { useUnitSelection } from '@/store/useUnitSelection';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomUnit } from '@/types/units';
import { useGameExport } from '@/hooks/useGameExport';

interface ExportSectionProps {
  customUnits: CustomUnit[];
}

export const ExportSection = ({ customUnits }: ExportSectionProps) => {
  const { 
    selectedUnitIds, 
    isExporting, 
    exportProgress, 
    exportMessage 
  } = useUnitSelection();

  const { exportGame } = useGameExport(customUnits);

  const selectedCount = selectedUnitIds.size;

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-6">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">
              {selectedCount > 0 ? (
                <>
                  <span className="font-semibold text-modded-gold">{selectedCount}</span>
                  <span className="text-muted-foreground"> custom unit{selectedCount !== 1 ? 's' : ''} selected for export</span>
                </>
              ) : (
                <span className="text-muted-foreground">Select custom units to include in your mod</span>
              )}
            </span>
          </div>

          {/* Export Button */}
          <Button
            size="lg"
            onClick={exportGame}
            disabled={selectedCount === 0 || isExporting}
            className="font-display bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-none shadow-lg hover:shadow-xl transition-all"
          >
            <Download className="w-5 h-5 mr-2" />
            {isExporting ? 'EXPORTING...' : 'DOWNLOAD MODDED GAME (~200MB)'}
          </Button>
        </div>

        {/* Progress Bar */}
        <AnimatePresence>
          {isExporting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <Progress value={exportProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2 text-center font-mono-stats">
                {exportMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

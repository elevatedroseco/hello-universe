import { useUnitSelection } from '@/store/useUnitSelection';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomUnit } from '@/types/units';
import { useGameExport } from '@/hooks/useGameExport';
import { isSupabaseConfigured } from '@/integrations/supabase/client';

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
  const hasSelection = selectedCount > 0;

  return (
    <AnimatePresence>
      {(hasSelection || isExporting) && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="sticky bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-md"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Left: count */}
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm">
                  <span className="font-semibold text-modded-gold">{selectedCount}</span>
                  <span className="text-muted-foreground"> unit{selectedCount !== 1 ? 's' : ''} selected</span>
                </span>
              </div>

              {/* Center: readiness badges */}
              <div className="hidden sm:flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  {isSupabaseConfigured ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-mutant-green" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  )}
                  Backend
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  {hasSelection ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-mutant-green" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  )}
                  Selection
                </span>
              </div>

              {/* Right: export button */}
              <Button
                size="sm"
                onClick={exportGame}
                disabled={!hasSelection || isExporting}
                className="font-display text-xs bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-none shadow-lg"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {isExporting ? 'EXPORTING...' : 'Export Mod Package'}
              </Button>
            </div>

            {/* Progress */}
            {isExporting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <Progress value={exportProgress} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1.5 text-center font-mono-stats">
                  {exportMessage}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

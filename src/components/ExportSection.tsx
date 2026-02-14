import { useState, useEffect } from 'react';
import { useUnitSelection } from '@/store/useUnitSelection';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Package, CheckCircle2, AlertCircle, HardDrive, Trash2, FileText, FileArchive, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomUnit } from '@/types/units';
import { useGameExport, ExportMode } from '@/hooks/useGameExport';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { getCacheSize, clearSkeletonCache } from '@/lib/skeletonCache';
import { toast } from 'sonner';

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
  const [exportMode, setExportMode] = useState<ExportMode>('standalone');
  const [cacheSize, setCacheSize] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    getCacheSize().then(setCacheSize);
  }, [isExporting]);

  const handleClearCache = async () => {
    await clearSkeletonCache();
    setCacheSize(null);
    toast.success('Skeleton cache cleared');
  };

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

              {/* Center: status + options toggle */}
              <div className="hidden sm:flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  {isSupabaseConfigured ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-mutant-green" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  )}
                  Backend
                </span>
                {cacheSize && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <HardDrive className="w-3.5 h-3.5 text-mutant-green" />
                    Cached ({(cacheSize / 1024 / 1024).toFixed(0)}MB)
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowOptions(v => !v)}
                >
                  {showOptions ? 'Hide options' : 'Export options'}
                </Button>
              </div>

              {/* Right: export button */}
              <Button
                size="sm"
                onClick={() => exportGame(exportMode)}
                disabled={!hasSelection || isExporting}
                className="font-display text-xs bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white border-none shadow-lg"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {isExporting ? 'EXPORTING...' : (
                  exportMode === 'standalone' ? 'Export Full Package' :
                  exportMode === 'mod-only' ? 'Export Mod Files' :
                  'Export Map Block'
                )}
              </Button>
            </div>

            {/* Export Options Panel */}
            <AnimatePresence>
              {showOptions && !isExporting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                    <RadioGroup value={exportMode} onValueChange={(v) => setExportMode(v as ExportMode)} className="flex flex-col sm:flex-row gap-3">
                      <Label className="flex items-start gap-2 cursor-pointer p-2 rounded-md border border-border hover:bg-accent/10 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value="standalone" className="mt-0.5" />
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-display">
                            <FileArchive className="w-3.5 h-3.5" />
                            Standalone ZIP
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Full game package (~220MB). Extract and play.</p>
                        </div>
                      </Label>

                      <Label className="flex items-start gap-2 cursor-pointer p-2 rounded-md border border-border hover:bg-accent/10 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value="mod-only" className="mt-0.5" />
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-display">
                            <FileText className="w-3.5 h-3.5" />
                            Mod Files Only
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">INI + MIX files only (~5MB). Install into TS folder.</p>
                        </div>
                      </Label>

                      <Label className="flex items-start gap-2 cursor-pointer p-2 rounded-md border border-border hover:bg-accent/10 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value="map-mod" className="mt-0.5" />
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-display">
                            <Map className="w-3.5 h-3.5" />
                            Map Mod INI
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Text file for FinalSun map injection.</p>
                        </div>
                      </Label>
                    </RadioGroup>

                    {/* Cache controls */}
                    {cacheSize && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleClearCache}>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Clear cache
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCustomUnits } from '@/hooks/useCustomUnits';
import { runValidation, ValidationIssue } from '@/lib/validation';
import { CustomUnit } from '@/types/units';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  ShieldCheck,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

const SEVERITY_ICON = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_VARIANT: Record<string, string> = {
  error: 'bg-destructive/20 text-destructive border-destructive/50',
  warning: 'bg-modded-gold/20 text-modded-gold border-modded-gold/50',
  info: 'bg-primary/20 text-primary border-primary/50',
};

const ValidationCenter = () => {
  const { customUnits, isLoading } = useCustomUnits();
  const queryClient = useQueryClient();
  const [results, setResults] = useState<ValidationIssue[] | null>(null);
  const [fixing, setFixing] = useState<string | null>(null);

  const handleRunValidation = useCallback((units?: CustomUnit[]) => {
    const unitsToValidate = units || customUnits;
    const issues = runValidation(unitsToValidate);
    setResults(issues);
    if (issues.length === 0) {
      toast.success('All units passed validation!');
    } else {
      toast.warning(`Found ${issues.length} issue(s) across ${unitsToValidate.length} units.`);
    }
  }, [customUnits]);

  const errorCount = results?.filter((r) => r.severity === 'error').length ?? 0;
  const warningCount = results?.filter((r) => r.severity === 'warning').length ?? 0;
  const infoCount = results?.filter((r) => r.severity === 'info').length ?? 0;

  const handleAutoFix = async (issue: ValidationIssue) => {
    if (!isSupabaseConfigured || !supabase || !issue.suggestion || !issue.field) return;
    setFixing(issue.unitId + issue.ruleId);
    try {
      // For prerequisite/owner fixes, update rules_json
      const unit = customUnits.find((u) => u.id === issue.unitId);
      if (!unit) throw new Error('Unit not found');

      if (issue.field === 'internal_name') {
        await supabase
          .from('custom_units')
          .update({ internal_name: issue.suggestion })
          .eq('id', issue.unitId);
      } else {
        const rules = { ...(unit.rulesJson || {}) } as Record<string, unknown>;
        const fieldMap: Record<string, string> = {
          prerequisite: 'Prerequisite',
          owner: 'Owner',
        };
        const key = fieldMap[issue.field] || issue.field;
        rules[key] = issue.suggestion;
        await supabase
          .from('custom_units')
          .update({ rules_json: rules } as any)
          .eq('id', issue.unitId);
      }

      toast.success(`Auto-fix applied to ${issue.unitName}`);
      // Invalidate cache and re-run after refetch
      await queryClient.invalidateQueries({ queryKey: ['custom-units'] });
      // Small delay to let React Query refetch
      setTimeout(() => {
        const freshUnits = queryClient.getQueryData<CustomUnit[]>(['custom-units']);
        if (freshUnits) handleRunValidation(freshUnits);
      }, 800);
    } catch (err) {
      toast.error(`Fix failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFixing(null);
    }
  };

  // Export dry run
  const dryRun = useMemo(() => {
    if (!customUnits.length) return null;
    const shpUnits = customUnits.filter((u) => u.renderType !== 'VOXEL');
    const vxlUnits = customUnits.filter((u) => u.renderType === 'VOXEL');
    const structureUnits = customUnits.filter((u) => u.category === 'Structure');

    // Estimate sizes
    const rulesEstimate = 0.5 + customUnits.length * 0.3; // KB per unit
    const artEstimate = 0.3 + customUnits.length * 0.15;

    let ecacheFiles = 0;
    let expandFiles = 0;
    customUnits.forEach((u) => {
      if (u.renderType === 'VOXEL') {
        expandFiles += 2; // VXL + HVA
        if (u.turretVxlPath) expandFiles++;
        if (u.barrelVxlPath) expandFiles++;
      } else {
        if (u.shpFilePath) ecacheFiles++;
      }
      if (u.icon_file_path) ecacheFiles++;
    });

    return {
      totalUnits: customUnits.length,
      shpCount: shpUnits.length,
      vxlCount: vxlUnits.length,
      structureCount: structureUnits.length,
      rulesSize: rulesEstimate.toFixed(1),
      artSize: artEstimate.toFixed(1),
      ecacheEntries: ecacheFiles,
      expandEntries: expandFiles,
      units: customUnits.map((u) => ({
        id: u.internalName,
        name: u.displayName,
        type: u.renderType || 'SHP',
        category: u.category,
      })),
    };
  }, [customUnits]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            VALIDATION CENTER
          </h1>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {customUnits.length} units
        </Badge>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Run Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => handleRunValidation()}
            disabled={isLoading || customUnits.length === 0}
            size="lg"
            className="bg-primary hover:bg-primary/90 font-display"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Run Validation
          </Button>

          {results !== null && (
            <div className="flex gap-2">
              {errorCount > 0 && (
                <Badge className={SEVERITY_VARIANT.error}>
                  {errorCount} error{errorCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge className={SEVERITY_VARIANT.warning}>
                  {warningCount} warning{warningCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {infoCount > 0 && (
                <Badge className={SEVERITY_VARIANT.info}>
                  {infoCount} info
                </Badge>
              )}
              {results.length === 0 && (
                <Badge className="bg-mutant-green/20 text-mutant-green border-mutant-green/50">
                  ✓ All clear
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results Table */}
        {results !== null && results.length > 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="w-20">Severity</TableHead>
                    <TableHead className="w-40">Unit</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead className="w-32">Suggestion</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((issue, i) => {
                    const Icon = SEVERITY_ICON[issue.severity];
                    return (
                      <TableRow key={i} className="border-border">
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${SEVERITY_VARIANT[issue.severity]}`}>
                            <Icon className="w-3 h-3" />
                            {issue.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-mono text-xs">{issue.internalName}</span>
                            <span className="text-xs text-muted-foreground block truncate">{issue.unitName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{issue.message}</TableCell>
                        <TableCell className="font-mono text-xs text-primary">
                          {issue.suggestion}
                        </TableCell>
                        <TableCell>
                          {issue.autoFix && issue.suggestion && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 border-border"
                              onClick={() => handleAutoFix(issue)}
                              disabled={fixing === issue.unitId + issue.ruleId}
                            >
                              {fixing === issue.unitId + issue.ruleId ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Fix'
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Export Dry Run */}
        {dryRun && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                EXPORT DRY RUN
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-xs space-y-1 text-muted-foreground">
                <p>Units to export: <span className="text-foreground">{dryRun.totalUnits}</span> ({dryRun.shpCount} SHP, {dryRun.vxlCount} Voxel, {dryRun.structureCount} Structure)</p>
                <p>rules.ini additions: ~<span className="text-foreground">{dryRun.rulesSize} KB</span></p>
                <p>art.ini additions: ~<span className="text-foreground">{dryRun.artSize} KB</span></p>
                <p>ecache99.mix: <span className="text-foreground">{dryRun.ecacheEntries}</span> files</p>
                {dryRun.expandEntries > 0 && (
                  <p>expand99.mix: <span className="text-foreground">{dryRun.expandEntries}</span> files</p>
                )}

                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-muted-foreground mb-1">Units included:</p>
                  {dryRun.units.map((u) => (
                    <p key={u.id}>
                      — <span className="text-foreground">{u.id}</span>: {u.name}{' '}
                      <span className="text-muted-foreground">({u.category}, {u.type})</span>
                    </p>
                  ))}
                </div>
              </div>

              {errorCount > 0 && (
                <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {errorCount} critical error{errorCount !== 1 ? 's' : ''} must be fixed before exporting.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ValidationCenter;

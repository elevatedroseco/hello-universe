import { Header } from '@/components/Header';
import { FactionTabs } from '@/components/FactionTabs';
import { CategoryTabs } from '@/components/CategoryTabs';
import { UnitGrid } from '@/components/UnitGrid';
import { ExportSection } from '@/components/ExportSection';
import { UnitEditorDrawer } from '@/components/UnitEditorDrawer';
import { useCustomUnits } from '@/hooks/useCustomUnits';
import { Toaster } from '@/components/ui/sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Index = () => {
  const { customUnits, addUnit, isCreating, error, isConfigMissing } = useCustomUnits();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertTitle>Custom units unavailable</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  The app can't connect to your backend because the frontend is missing environment variables.
                </p>
                <p className="font-mono text-xs break-all">
                  {error instanceof Error ? error.message : String(error)}
                </p>
                <p className="mt-2">
                  Please ensure <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
                  <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> are configured for the preview environment, then refresh.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <FactionTabs />
          <CategoryTabs />
        </div>

        {/* Unit Grid (includes FilterBar + Tabs) */}
        <UnitGrid customUnits={customUnits} isConfigMissing={isConfigMissing} />
      </main>

      <ExportSection customUnits={customUnits} />
      <UnitEditorDrawer onUnitCreated={addUnit} isCreating={isCreating} />
      <Toaster />
    </div>
  );
};

export default Index;

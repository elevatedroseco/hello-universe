import { useUnitSelection } from '@/store/useUnitSelection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Hammer, Wifi, WifiOff, ShieldCheck, Crosshair } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured } from '@/integrations/supabase/client';

export const Header = () => {
  const { selectedUnitIds, activeFaction, activeCategory, setDrawerOpen } = useUnitSelection();
  const selectedCount = selectedUnitIds.size;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0">🎮</span>
            <h1 className="font-display text-base md:text-xl font-bold gradient-heading truncate">
              TIBSUN MOD KIT
            </h1>
          </div>

          {/* Status Chips */}
          <div className="hidden sm:flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono-stats border-border text-muted-foreground">
              {activeFaction} · {activeCategory}
            </Badge>
            {selectedCount > 0 && (
              <Badge
                variant="outline"
                className="border-modded-gold text-modded-gold bg-modded-gold/10 font-mono-stats text-xs"
              >
                {selectedCount} Selected
              </Badge>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground" title={isSupabaseConfigured ? 'Backend connected' : 'Backend not connected'}>
              {isSupabaseConfigured ? (
                <Wifi className="w-3.5 h-3.5 text-mutant-green" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-destructive" />
              )}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" asChild className="font-display text-xs text-muted-foreground hover:text-foreground">
              <Link to="/admin">
                <Hammer className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Unit Forge</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="font-display text-xs text-muted-foreground hover:text-foreground">
              <Link to="/weapons">
                <Crosshair className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Weapons</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="font-display text-xs text-muted-foreground hover:text-foreground">
              <Link to="/validate">
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Validate</span>
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="bg-modded-gold hover:bg-modded-gold-glow text-black font-display text-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Create Unit</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

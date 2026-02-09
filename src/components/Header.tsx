import { useUnitSelection } from '@/store/useUnitSelection';
import { Badge } from '@/components/ui/badge';

export const Header = () => {
  const selectedCount = useUnitSelection((state) => state.selectedUnitIds.size);

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎮</span>
            <h1 className="font-display text-xl md:text-2xl font-bold gradient-heading">
              TIBSUN MOD CONSTRUCTION KIT
            </h1>
          </div>
          
          {selectedCount > 0 && (
            <Badge 
              variant="outline" 
              className="border-modded-gold text-modded-gold bg-modded-gold/10 font-mono-stats"
            >
              {selectedCount} Selected
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
};

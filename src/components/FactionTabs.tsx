import { useUnitSelection } from '@/store/useUnitSelection';
import { Faction } from '@/types/units';
import { cn } from '@/lib/utils';

const factions: { id: Faction; label: string; color: string }[] = [
  { id: 'GDI', label: 'GDI', color: 'gdi-blue' },
  { id: 'Nod', label: 'NOD', color: 'nod-red' },
  { id: 'Mutant', label: 'MUTANT', color: 'mutant-green' },
];

export const FactionTabs = () => {
  const { activeFaction, setActiveFaction } = useUnitSelection();

  return (
    <div className="flex gap-2">
      {factions.map((faction) => (
        <button
          key={faction.id}
          onClick={() => setActiveFaction(faction.id)}
          className={cn(
            'px-4 py-2 font-display text-sm font-semibold rounded-md transition-all duration-200',
            'border-2',
            activeFaction === faction.id
              ? faction.id === 'GDI'
                ? 'border-gdi-blue bg-gdi-blue/20 text-gdi-blue glow-gdi'
                : faction.id === 'Nod'
                  ? 'border-nod-red bg-nod-red/20 text-nod-red glow-nod'
                  : 'border-mutant-green bg-mutant-green/20 text-mutant-green glow-mutant'
              : 'border-border bg-card/50 text-muted-foreground hover:border-muted-foreground/50'
          )}
        >
          {faction.label}
        </button>
      ))}
    </div>
  );
};

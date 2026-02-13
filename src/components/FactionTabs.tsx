import { useUnitSelection } from '@/store/useUnitSelection';
import { Faction } from '@/types/units';
import { SegmentedControl, SegmentItem } from '@/components/ui/segmented-control';

const factions: SegmentItem[] = [
  { id: 'GDI', label: 'GDI', activeClassName: 'border-2 border-gdi-blue bg-gdi-blue/20 text-gdi-blue' },
  { id: 'Nod', label: 'NOD', activeClassName: 'border-2 border-nod-red bg-nod-red/20 text-nod-red' },
  { id: 'Mutant', label: 'MUTANT', activeClassName: 'border-2 border-mutant-green bg-mutant-green/20 text-mutant-green' },
];

export const FactionTabs = () => {
  const { activeFaction, setActiveFaction } = useUnitSelection();

  return (
    <SegmentedControl
      items={factions}
      value={activeFaction}
      onChange={(id) => setActiveFaction(id as Faction)}
    />
  );
};

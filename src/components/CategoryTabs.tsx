import { useUnitSelection } from '@/store/useUnitSelection';
import { UnitCategory } from '@/types/units';
import { SegmentedControl, SegmentItem } from '@/components/ui/segmented-control';
import { User, Car, Plane, Building2 } from 'lucide-react';

const categories: SegmentItem[] = [
  { id: 'Infantry', label: 'Infantry', icon: User },
  { id: 'Vehicle', label: 'Vehicles', icon: Car },
  { id: 'Aircraft', label: 'Aircraft', icon: Plane },
  { id: 'Structure', label: 'Structures', icon: Building2 },
];

export const CategoryTabs = () => {
  const { activeCategory, setActiveCategory } = useUnitSelection();

  return (
    <SegmentedControl
      items={categories}
      value={activeCategory}
      onChange={(id) => setActiveCategory(id as UnitCategory)}
    />
  );
};

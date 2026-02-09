import { useUnitSelection } from '@/store/useUnitSelection';
import { UnitCategory } from '@/types/units';
import { cn } from '@/lib/utils';
import { User, Car, Plane } from 'lucide-react';

const categories: { id: UnitCategory; label: string; icon: React.ElementType }[] = [
  { id: 'Infantry', label: 'Infantry', icon: User },
  { id: 'Vehicle', label: 'Vehicles', icon: Car },
  { id: 'Aircraft', label: 'Aircraft', icon: Plane },
];

export const CategoryTabs = () => {
  const { activeCategory, setActiveCategory } = useUnitSelection();

  return (
    <div className="flex gap-1 bg-card/50 p-1 rounded-lg border border-border">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
              activeCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{category.label}</span>
          </button>
        );
      })}
    </div>
  );
};

import { useUnitSelection } from '@/store/useUnitSelection';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface FilterBarProps {
  unitCount: number;
}

export const FilterBar = ({ unitCount }: FilterBarProps) => {
  const { searchQuery, setSearchQuery, sortBy, setSortBy } = useUnitSelection();

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search units..."
          className="pl-9 h-9 text-sm bg-card/50"
        />
      </div>

      {/* Sort */}
      <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
        <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm bg-card/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="techLevel">Tech Level</SelectItem>
          <SelectItem value="cost">Cost</SelectItem>
          <SelectItem value="strength">Strength</SelectItem>
          <SelectItem value="name">Name</SelectItem>
        </SelectContent>
      </Select>

      {/* Count */}
      <span className="text-xs text-muted-foreground font-mono-stats whitespace-nowrap self-center">
        {unitCount} unit{unitCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
};

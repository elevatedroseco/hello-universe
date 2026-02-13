import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface SegmentItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  activeClassName?: string;
}

interface SegmentedControlProps {
  items: SegmentItem[];
  value: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
}

export const SegmentedControl = ({ items, value, onChange, size = 'md' }: SegmentedControlProps) => {
  return (
    <div className="flex gap-1 bg-card/50 p-1 rounded-lg border border-border" role="tablist">
      {items.map((item) => {
        const isActive = value === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex items-center gap-2 rounded-md font-display font-semibold transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
              isActive
                ? item.activeClassName || 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            {Icon && <Icon className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />}
            <span className={cn(Icon && 'hidden sm:inline')}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

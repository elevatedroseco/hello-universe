import { Skeleton } from '@/components/ui/skeleton';

export const UnitCardSkeleton = () => (
  <div className="rounded-lg bg-card border-2 border-border p-4 space-y-3">
    {/* Image area */}
    <Skeleton className="aspect-square w-full rounded-md" />
    {/* Internal name */}
    <Skeleton className="h-3 w-16" />
    {/* Display name */}
    <Skeleton className="h-4 w-3/4" />
    {/* Stats row */}
    <div className="grid grid-cols-3 gap-1">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
    </div>
    {/* Tech level */}
    <Skeleton className="h-3 w-20" />
  </div>
);

export const UnitGridSkeleton = ({ count = 10 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <UnitCardSkeleton key={i} />
    ))}
  </div>
);

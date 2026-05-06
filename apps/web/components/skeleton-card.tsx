import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  featured?: boolean;
}

export function SkeletonCard({ featured = false }: Props) {
  return (
    <Card
      className={cn('overflow-hidden border-border', featured && 'col-span-full md:col-span-2')}
    >
      <Skeleton className={cn('w-full', featured ? 'h-96' : 'h-56')} />
      <div className="p-6">
        <Skeleton className="h-6 w-24 mb-3 rounded-full" />
        <Skeleton className={cn('h-6 w-full mb-2', featured && 'h-8')} />
        <Skeleton className={cn('h-6 w-3/4 mb-4', featured && 'h-8')} />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SkeletonFeed() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonCard featured />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

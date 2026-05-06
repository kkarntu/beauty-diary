import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  featured?: boolean;
}

export function SkeletonCard({ featured = false }: Props) {
  return (
    <Card
      className={cn('border-border overflow-hidden', featured && 'col-span-full md:col-span-2')}
    >
      <Skeleton className={cn('w-full', featured ? 'h-96' : 'h-56')} />
      <div className="p-6">
        <Skeleton className="mb-3 h-6 w-24 rounded-full" />
        <Skeleton className={cn('mb-2 h-6 w-full', featured && 'h-8')} />
        <Skeleton className={cn('mb-4 h-6 w-3/4', featured && 'h-8')} />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-4 h-4 w-2/3" />
        <div className="border-border flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="mb-1 h-4 w-24" />
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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <SkeletonCard featured />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

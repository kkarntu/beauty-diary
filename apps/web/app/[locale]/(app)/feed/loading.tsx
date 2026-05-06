import { SkeletonFeed } from '@/components/skeleton-card';

export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-6 py-8 lg:px-20">
      <div className="bg-surface-muted h-9 w-48 animate-pulse rounded-md" />
      <div className="bg-surface-muted h-10 animate-pulse rounded-md" />
      <SkeletonFeed />
    </div>
  );
}

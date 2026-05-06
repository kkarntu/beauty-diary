import { SkeletonFeed } from '@/components/skeleton-card';

export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 lg:px-20 py-8 space-y-8">
      <div className="h-9 w-48 rounded-md bg-surface-muted animate-pulse" />
      <div className="h-10 rounded-md bg-surface-muted animate-pulse" />
      <SkeletonFeed />
    </div>
  );
}

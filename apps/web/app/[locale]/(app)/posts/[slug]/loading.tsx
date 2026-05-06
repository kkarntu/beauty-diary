export default function PostLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <div className="bg-surface-muted h-6 w-24 animate-pulse rounded-full" />
      <div className="bg-surface-muted h-12 w-full animate-pulse rounded-md" />
      <div className="bg-surface-muted h-6 w-3/4 animate-pulse rounded-md" />
      <div className="bg-surface-muted h-[400px] w-full animate-pulse rounded-lg" />
      <div className="space-y-3">
        <div className="bg-surface-muted h-4 w-full animate-pulse rounded-md" />
        <div className="bg-surface-muted h-4 w-full animate-pulse rounded-md" />
        <div className="bg-surface-muted h-4 w-2/3 animate-pulse rounded-md" />
      </div>
    </div>
  );
}

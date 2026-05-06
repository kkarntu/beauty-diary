export default function PostLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
      <div className="h-6 w-24 rounded-full bg-surface-muted animate-pulse" />
      <div className="h-12 w-full rounded-md bg-surface-muted animate-pulse" />
      <div className="h-6 w-3/4 rounded-md bg-surface-muted animate-pulse" />
      <div className="h-[400px] w-full rounded-lg bg-surface-muted animate-pulse" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded-md bg-surface-muted animate-pulse" />
        <div className="h-4 w-full rounded-md bg-surface-muted animate-pulse" />
        <div className="h-4 w-2/3 rounded-md bg-surface-muted animate-pulse" />
      </div>
    </div>
  );
}

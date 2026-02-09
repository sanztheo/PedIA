import { Skeleton } from '@/components/ui/skeleton';

export function WikiPageSkeleton() {
  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {/* Header skeleton */}
        <header className="relative border-b border-border/50">
          <div className="relative px-8 lg:px-12 py-10 lg:py-14">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            
            {/* Top bar */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>

            {/* Title */}
            <Skeleton className="h-12 sm:h-14 lg:h-16 w-3/4 mb-8" />

            {/* Meta */}
            <div className="flex items-center gap-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </header>

        {/* Content skeleton */}
        <div className="px-8 lg:px-12 py-10 lg:py-14 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="h-6 w-1/4 mt-8" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>

      {/* Sidebar skeleton */}
      <aside className="hidden xl:block w-80 border-l border-border/50 bg-muted/5 p-6">
        <Skeleton className="h-6 w-20 mb-6" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </aside>
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-dark-surface rounded-xl p-4 border border-gray-100 dark:border-dark-border animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
    </div>
  )
}

export function SkeletonTask() {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl p-3.5 border border-gray-100 dark:border-dark-border animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonSession() {
  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border animate-pulse">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8" />
      </div>
      <div className="px-4 pb-4 space-y-1.5">
        <SkeletonTask />
        <SkeletonTask />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonCard className="h-20" />
      <SkeletonSession />
      <SkeletonSession />
    </div>
  )
}

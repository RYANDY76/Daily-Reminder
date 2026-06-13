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

export function CalendarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard className="h-48" />
    </div>
  )
}

export function GoalsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function HabitsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="flex gap-2">
                {Array.from({ length: 7 }, (_, j) => (
                  <div key={j} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PomodoroSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div className="flex justify-center">
        <div className="w-48 h-48 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="flex justify-center gap-3">
        <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-white dark:bg-dark-surface rounded-xl p-4 border border-gray-100 dark:border-dark-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function CoupleSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
      </div>
      <SkeletonCard className="h-48" />
    </div>
  )
}

export function LandingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-center pt-12">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto" />
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-80 mx-auto" />
      <div className="flex justify-center gap-3 pt-4">
        <div className="h-12 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-12 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl mx-4" />
    </div>
  )
}

export function NotFoundSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3" />
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6" />
      <div className="h-12 w-36 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  )
}

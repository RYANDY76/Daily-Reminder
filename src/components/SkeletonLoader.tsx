interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'circle' | 'stat' | 'list'
  count?: number
  className?: string
}

export default function SkeletonLoader({ 
  type = 'card', 
  count = 1,
  className = '' 
}: SkeletonLoaderProps) {
  
  if (type === 'card') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'stat') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'circle') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" 
          />
        ))}
      </div>
    )
  }

  // text type
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

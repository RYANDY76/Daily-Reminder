import { useMemo } from 'react'

const GRADIENTS = [
  'from-primary-400 to-primary-600',
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-orange-400 to-orange-600',
  'from-teal-400 to-teal-600',
  'from-rose-400 to-rose-600',
  'from-indigo-400 to-indigo-600',
  'from-cyan-400 to-cyan-600',
  'from-emerald-400 to-emerald-600',
]

function hashColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

function getInitial(name: string): string {
  return (name || '?').trim().charAt(0).toUpperCase()
}

interface AvatarProps {
  name: string
  photoUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
}

export default function Avatar({ name, photoUrl, size = 'md', className = '' }: AvatarProps) {
  const gradient = useMemo(() => hashColor(name), [name])
  const initial = useMemo(() => getInitial(name), [name])

  if (photoUrl?.startsWith('http')) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeMap[size]} rounded-full object-cover ${className}`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none'
          ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
        }}
      />
    )
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}
      title={name}
    >
      {initial}
    </div>
  )
}

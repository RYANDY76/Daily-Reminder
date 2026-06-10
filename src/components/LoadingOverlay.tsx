import { Loader2 } from 'lucide-react'
import { useT } from '../i18n'

interface LoadingOverlayProps {
  message?: string
  transparent?: boolean
}

export default function LoadingOverlay({ message, transparent = false }: LoadingOverlayProps) {
  const t = useT()

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        transparent ? 'bg-black/20' : 'bg-black/50'
      } backdrop-blur-sm`}
      role="progressbar"
      aria-label={message || t('common.loading')}
    >
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-6 min-w-[200px] flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {message || t('common.loading')}
        </p>
      </div>
    </div>
  )
}

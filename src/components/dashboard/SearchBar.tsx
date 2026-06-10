import { useT } from '../../i18n'
import { Search, X } from 'lucide-react'
import { RefObject } from 'react'

interface SearchBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchInputRef: RefObject<HTMLInputElement>
  allTags: string[]
  selectedTag: string | null
  setSelectedTag: (tag: string | null) => void
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  searchInputRef,
  allTags,
  selectedTag,
  setSelectedTag
}: SearchBarProps) {
  const t = useT()

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('dashboard.search')}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200 text-sm"
          aria-label={t('dashboard.search')}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 min-h-tap min-w-tap flex items-center justify-center"
            aria-label={t('dashboard.clearSearch')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button
            onClick={() => setSelectedTag(null)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors min-h-tap ${
              !selectedTag ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t('dashboard.all')}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors min-h-tap ${
                selectedTag === tag ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

import type { ReactNode } from 'react'

interface PageHeroProps {
  icon: ReactNode
  title: string
  subtitle?: string
  gradient?: string
  children?: ReactNode
}

export default function PageHero({ icon, title, subtitle, gradient = 'from-primary-500 to-primary-600', children }: PageHeroProps) {
  return (
    <div className="page-hero">
      <div className={`page-hero-gradient bg-gradient-to-br ${gradient}`} />
      <div className="page-hero-content">
        <div className="page-hero-icon bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm">
          {icon}
        </div>
        <h1 className="page-hero-title">{title}</h1>
        {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  )
}

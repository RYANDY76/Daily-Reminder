export default function AvoraLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 8L18 88L32 88L38 72L62 72L68 88L82 88L50 8Z" fill="currentColor" opacity="0.95"/>
      <path d="M50 32L38 62L62 62L50 32Z" fill="var(--color-bg, #070B1A)"/>
      <path d="M38 72C34 60 42 50 50 50C58 50 66 60 62 72C60 78 54 82 50 82C46 82 44 78 42 76"
            fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="30" cy="80" r="2.5" fill="#55C8FF" opacity="0.8"/>
      <circle cx="70" cy="80" r="2" fill="#EC6BFF" opacity="0.6"/>
    </svg>
  )
}

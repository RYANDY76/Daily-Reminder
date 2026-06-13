export default function AvoraLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="alogo-chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B0C4DE"/>
          <stop offset="20%" stopColor="#E8EEF6"/>
          <stop offset="40%" stopColor="#FFFFFF"/>
          <stop offset="60%" stopColor="#C0D0E8"/>
          <stop offset="80%" stopColor="#8898B8"/>
          <stop offset="100%" stopColor="#D0DAE8"/>
        </linearGradient>
        <linearGradient id="alogo-chrome-dark" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#405068"/>
          <stop offset="50%" stopColor="#8898B8"/>
          <stop offset="100%" stopColor="#303848"/>
        </linearGradient>
        <linearGradient id="alogo-blue" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#55C8FF" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#2080C0" stopOpacity="0.3"/>
        </linearGradient>
        <linearGradient id="alogo-pink" x1="1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#EC6BFF" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#A030C0" stopOpacity="0.3"/>
        </linearGradient>
      </defs>
      {/* Left leg */}
      <path d="M256 60L120 420L180 450L220 340" fill="url(#alogo-chrome)"/>
      {/* Right leg */}
      <path d="M256 60L392 420L332 450L292 340" fill="url(#alogo-chrome-dark)"/>
      {/* Crossbar */}
      <path d="M180 340C200 310 230 295 256 295C282 295 312 310 332 340C340 355 335 365 328 370C310 380 282 385 256 385C230 385 202 380 184 370C177 365 172 355 180 340Z" fill="url(#alogo-chrome)"/>
      {/* Inner cutout */}
      <path d="M256 120L340 340C345 352 340 358 332 362C318 368 290 372 256 372C222 372 194 368 180 362C172 358 167 352 172 340L256 120Z" fill="var(--color-bg, #070B1A)"/>
      {/* Blue reflection left */}
      <path d="M256 65L130 420L160 420L256 130Z" fill="url(#alogo-blue)" opacity="0.5"/>
      {/* Pink reflection right */}
      <path d="M256 65L382 420L352 420L256 130Z" fill="url(#alogo-pink)" opacity="0.5"/>
      {/* Chrome highlight */}
      <path d="M256 65L240 110" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" opacity="0.6"/>
      {/* Edge highlights */}
      <path d="M256 65L125 418" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M256 65L387 418" stroke="#A0B0C8" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    </svg>
  )
}

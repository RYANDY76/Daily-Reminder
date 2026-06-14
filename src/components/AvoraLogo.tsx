export default function AvoraLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ac-chrome" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#A8B8D0"/>
          <stop offset="25%" stopColor="#F0F4FA"/>
          <stop offset="38%" stopColor="#FFFFFF"/>
          <stop offset="50%" stopColor="#C8D8EC"/>
          <stop offset="75%" stopColor="#B0C0D8"/>
          <stop offset="100%" stopColor="#98A8C0"/>
        </linearGradient>
        <linearGradient id="ac-dark" x1="0.9" y1="0" x2="0.1" y2="1">
          <stop offset="0%" stopColor="#506078"/>
          <stop offset="50%" stopColor="#405068"/>
          <stop offset="100%" stopColor="#283040"/>
        </linearGradient>
        <linearGradient id="ac-blue" x1="0" y1="0.2" x2="0.4" y2="0.8">
          <stop offset="0%" stopColor="#7DD4FF" stopOpacity="0.95"/>
          <stop offset="60%" stopColor="#3AA8E8" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#2080C0" stopOpacity="0.15"/>
        </linearGradient>
        <linearGradient id="ac-pink" x1="1" y1="0.2" x2="0.6" y2="0.8">
          <stop offset="0%" stopColor="#F080FF" stopOpacity="0.95"/>
          <stop offset="60%" stopColor="#D050E0" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#A030C0" stopOpacity="0.15"/>
        </linearGradient>
        <linearGradient id="ac-purple" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#A070FF" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#6D3FD6" stopOpacity="0.1"/>
        </linearGradient>
        <linearGradient id="ac-hl" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      {/* Left leg */}
      <path d="M256 55C250 55 240 58 232 65L105 400C95 428 100 448 115 455C125 460 140 458 155 450L195 335C210 305 235 290 256 290" fill="url(#ac-chrome)"/>
      {/* Right leg */}
      <path d="M256 55C262 55 272 58 280 65L407 400C417 428 412 448 397 455C387 460 372 458 357 450L317 335C302 305 277 290 256 290" fill="url(#ac-dark)"/>
      {/* Crossbar */}
      <path d="M195 335C215 305 238 290 256 290C274 290 297 305 317 335C330 355 325 370 315 378C300 390 278 395 256 395C234 395 212 390 197 378C187 370 182 355 195 335Z" fill="url(#ac-chrome)"/>
      {/* Inner cutout */}
      <path d="M256 110C262 110 270 115 278 125L355 330C362 348 358 360 348 368C335 378 310 385 256 385C202 385 177 378 164 368C154 360 150 348 157 330L234 125C242 115 250 110 256 110Z" fill="var(--color-bg, #070B1A)"/>
      {/* Blue reflection */}
      <path d="M232 65L105 400C95 428 100 448 115 455C125 460 140 458 155 450L195 335C210 305 235 290 256 290L256 55C248 55 238 58 232 65Z" fill="url(#ac-blue)" opacity="0.7"/>
      {/* Pink reflection */}
      <path d="M280 65L407 400C417 428 412 448 397 455C387 460 372 458 357 450L317 335C302 305 277 290 256 290L256 55C264 55 274 58 280 65Z" fill="url(#ac-pink)" opacity="0.7"/>
      {/* Purple accent */}
      <path d="M200 340C218 312 240 298 256 298C272 298 294 312 312 340C322 355 318 365 310 372C298 382 278 388 256 388C234 388 214 382 202 372C194 365 190 355 200 340Z" fill="url(#ac-purple)" opacity="0.35"/>
      {/* Chrome highlight */}
      <path d="M256 60C252 60 246 63 242 70L236 95" stroke="url(#ac-hl)" strokeWidth="5" strokeLinecap="round"/>
      {/* Edge highlights */}
      <path d="M232 68L115 445" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <path d="M280 68L397 445" stroke="#98A8C0" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      {/* Fluid loop */}
      <path d="M220 345C215 325 228 310 256 310C284 310 297 325 292 345C288 360 274 370 256 370C238 370 224 360 220 345Z" fill="none" stroke="#D0DAE8" strokeWidth="4" strokeLinecap="round"/>
      <path d="M225 342C222 328 232 316 256 316C280 316 290 328 287 342" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35"/>
      {/* Bottom dots */}
      <circle cx="120" cy="448" r="3" fill="#55C8FF" opacity="0.5"/>
      <circle cx="392" cy="448" r="2.5" fill="#EC6BFF" opacity="0.4"/>
    </svg>
  )
}

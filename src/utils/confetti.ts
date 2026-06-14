const COLORS = ['#F59E0B', '#EC4899', '#55C8FF', '#8B5CF6', '#10B981', '#EF4444']

export function showConfetti(count: number = 30) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div')
      el.className = 'confetti-particle'
      el.style.left = Math.random() * 100 + 'vw'
      el.style.top = '-10px'
      el.style.backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)]
      el.style.animationDuration = (1 + Math.random()) + 's'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 2000)
    }, i * 30)
  }
}

export function showStarConfetti() {
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:64px;z-index:9999;animation:confetti-fall 1.5s ease-out forwards;pointer-events:none;'
  el.textContent = '⭐'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}

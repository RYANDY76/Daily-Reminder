import { useEffect, useState } from 'react'

interface ConfettiProps {
  show: boolean
  onComplete?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  rotation: number
  color: string
  size: number
  velocityX: number
  velocityY: number
  rotationSpeed: number
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#C7CEEA', '#FFDAC1', '#B4F8C8']

export default function Confetti({ show, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!show) {
      setParticles([])
      return
    }

    // Generate particles
    const newParticles: Particle[] = []
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        rotation: Math.random() * 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 10 + 5,
        velocityX: (Math.random() - 0.5) * 8,
        velocityY: Math.random() * 3 + 2,
        rotationSpeed: (Math.random() - 0.5) * 10
      })
    }
    setParticles(newParticles)

    // Auto cleanup after 3 seconds
    const timer = setTimeout(() => {
      setParticles([])
      onComplete?.()
    }, 3000)

    return () => clearTimeout(timer)
  }, [show, onComplete])

  useEffect(() => {
    if (particles.length === 0) return

    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(p => ({
          ...p,
          x: p.x + p.velocityX,
          y: p.y + p.velocityY,
          rotation: p.rotation + p.rotationSpeed,
          velocityY: p.velocityY + 0.2 // Gravity
        })).filter(p => p.y < window.innerHeight + 50)
      )
    }, 16)

    return () => clearInterval(interval)
  }, [particles.length])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" style={{ overflow: 'hidden' }}>
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            transition: 'all 0.016s linear'
          }}
        />
      ))}
    </div>
  )
}

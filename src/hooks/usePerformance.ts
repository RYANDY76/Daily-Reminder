/**
 * Performance Monitoring Hook
 * Track component render times and identify bottlenecks
 */

import { useEffect, useRef } from 'react'

interface PerformanceMetric {
  componentName: string
  renderTime: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 100

  logRender(componentName: string, renderTime: number) {
    this.metrics.push({
      componentName,
      renderTime,
      timestamp: Date.now()
    })

    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Warn about slow renders in development
    if (import.meta.env.DEV && renderTime > 16) {
      console.warn(
        `[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render (target: <16ms)`
      )
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getSlowestRenders(limit: number = 10): PerformanceMetric[] {
    return [...this.metrics]
      .sort((a, b) => b.renderTime - a.renderTime)
      .slice(0, limit)
  }

  getAverageRenderTime(componentName?: string): number {
    const filtered = componentName
      ? this.metrics.filter(m => m.componentName === componentName)
      : this.metrics

    if (filtered.length === 0) return 0

    const total = filtered.reduce((sum, m) => sum + m.renderTime, 0)
    return total / filtered.length
  }

  clear() {
    this.metrics = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

/**
 * Hook to measure component render performance
 */
export function usePerformance(componentName: string, enabled: boolean = import.meta.env.DEV) {
  const renderStartRef = useRef<number>(0)
  const renderCountRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    const renderTime = performance.now() - renderStartRef.current
    renderCountRef.current++

    if (renderCountRef.current > 1) {
      performanceMonitor.logRender(componentName, renderTime)
    }
  })

  if (enabled) {
    renderStartRef.current = performance.now()
  }

  return {
    renderCount: renderCountRef.current,
    getMetrics: () => performanceMonitor.getMetrics(),
    getAverage: () => performanceMonitor.getAverageRenderTime(componentName)
  }
}

/**
 * Hook to measure async operation performance
 */
export function useMeasureAsync() {
  return async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start

      if (import.meta.env.DEV) {
        console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }
}

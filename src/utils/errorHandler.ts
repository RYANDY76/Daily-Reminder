/**
 * Global Error Handler
 * Centralized error handling and reporting
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AppError {
  code: string
  message: string
  severity: ErrorSeverity
  details?: unknown
  timestamp: number
}

export class AppErrorHandler {
  private static errors: AppError[] = []
  private static maxErrors = 50

  private static remoteUrl: string | null = null

  static configureRemote(url: string): void {
    this.remoteUrl = url
  }

  private static reportToRemote(error: AppError): void {
    if (!this.remoteUrl) return
    const payload = { ...error, timestamp: new Date(error.timestamp).toISOString() }
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.remoteUrl, JSON.stringify(payload))
    }
  }

  static logError(
    code: string,
    message: string,
    severity: ErrorSeverity = 'medium',
    details?: unknown
  ): AppError {
    const error: AppError = {
      code,
      message,
      severity,
      details,
      timestamp: Date.now()
    }

    this.errors.push(error)
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${severity.toUpperCase()}] ${code}:`, message, details)
    }

    // Persist errors to localStorage
    this.persistErrors()

    // Report to remote endpoint if configured (production only)
    if (!import.meta.env.DEV) {
      this.reportToRemote(error)
    }

    return error
  }

  private static persistErrors(): void {
    try {
      const errors = this.errors.slice(-100).map(e => ({
        ...e,
        timestamp: new Date(e.timestamp).toISOString()
      }))
      localStorage.setItem('app_error_log', JSON.stringify(errors))
    } catch { if (import.meta.env.DEV) console.warn('[ErrorHandler] persist failed') }
  }

  static getErrors(): AppError[] {
    return [...this.errors]
  }

  static clearErrors(): void {
    this.errors = []
  }

  static getCriticalErrors(): AppError[] {
    return this.errors.filter(e => e.severity === 'critical')
  }
}

/**
 * Retry logic for async operations
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | unknown

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt < maxRetries - 1) {
        // Wait before retry with exponential backoff + jitter
        const backoff = delay * Math.pow(2, attempt)
        const jitter = Math.random() * 0.3 * backoff // 0-30% jitter
        await new Promise(resolve => setTimeout(resolve, backoff + jitter))
      }
    }
  }

  throw lastError
}

/**
 * Check if error is network related
 */
export function isNetworkError(error: unknown): boolean {
  // TypeError is commonly thrown for network failures
  if (error instanceof TypeError) {
    return true
  }
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('Failed to fetch')
    )
  }
  return false
}

/**
 * Check if error is quota exceeded (storage)
 */
export function isQuotaError(error: unknown): boolean {
  // DOMException with QuotaExceededError name is the canonical check
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return true
  }
  if (error instanceof Error) {
    return (
      error.message.includes('quota') ||
      error.message.includes('QuotaExceededError') ||
      error.message.includes('storage')
    )
  }
  return false
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: unknown, t: (key: string) => string): string {
  if (isNetworkError(error)) {
    return t('error.network')
  }
  
  if (isQuotaError(error)) {
    return t('error.storage')
  }

  if (error instanceof Error) {
    return t('error.generic')
  }

  return t('error.generic')
}

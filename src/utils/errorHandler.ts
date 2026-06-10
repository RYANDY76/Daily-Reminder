/**
 * Global Error Handler
 * Centralized error handling and reporting
 */

import { useToast } from '../hooks/useToast'

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

    return error
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
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError
}

/**
 * Safe async wrapper with error handling
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  errorCode: string = 'UNKNOWN_ERROR'
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    AppErrorHandler.logError(
      errorCode,
      error instanceof Error ? error.message : 'Unknown error occurred',
      'medium',
      error
    )
    return fallback
  }
}

/**
 * Check if error is network related
 */
export function isNetworkError(error: unknown): boolean {
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
    return error.message
  }

  return t('error.generic')
}

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { t } from '../i18n'
import { AppErrorHandler } from '../utils/errorHandler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
  retryCount: number
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    
    // Log to our error handler
    AppErrorHandler.logError(
      'COMPONENT_ERROR',
      error.message,
      'critical',
      { error, errorInfo }
    )
    
    this.setState({
      errorInfo: errorInfo?.componentStack || null
    })
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-dark-bg">
          <div className="max-w-md w-full bg-white dark:bg-dark-card rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Something went wrong
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {this.state.error?.message || t('error.generic')}
                </p>
              </div>
            </div>

            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-dark-bg p-3 rounded-lg overflow-auto max-h-40">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="whitespace-pre-wrap break-words">
                  {this.state.errorInfo}
                </pre>
              </details>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={this.handleRetry}
                className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t('error.retry')}
                {this.state.retryCount > 0 && ` (${this.state.retryCount})`}
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
            </div>

            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              If the problem persists, try clearing your browser cache
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}


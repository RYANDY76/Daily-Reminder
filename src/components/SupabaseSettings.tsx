import { useState } from 'react'
import { useT } from '../i18n'
import { getSupabaseConfig, saveSupabaseConfig } from '../lib/supabaseConfig'
import { resetSupabaseClient, testSupabaseConnection } from '../lib/supabase'
import { isCoupleSyncEnabled } from '../services/coupleSync'
import { CheckCircle2, XCircle, Cloud, Loader2 } from 'lucide-react'

export default function SupabaseSettings() {
  const t = useT()
  const config = getSupabaseConfig()
  const [urlInput, setUrlInput] = useState(config.url)
  const [keyInput, setKeyInput] = useState(config.anonKey)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(
    isCoupleSyncEnabled() ? 'ok' : null
  )
  const [testError, setTestError] = useState('')

  const handleSave = () => {
    saveSupabaseConfig(urlInput, keyInput)
    resetSupabaseClient()
    setSaved(true)
    setTestResult(null)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTest = async () => {
    if (config.source !== 'env') {
      saveSupabaseConfig(urlInput, keyInput)
      resetSupabaseClient()
    }
    setTesting(true)
    setTestResult(null)
    setTestError('')

    const result = await testSupabaseConnection()
    setTesting(false)

    if (result.ok) {
      setTestResult('ok')
    } else {
      setTestResult('fail')
      if (result.error === 'not_configured') {
        setTestError(t('settings.supabaseNotConfigured'))
      } else if (result.error === 'schema_missing') {
        setTestError(t('settings.supabaseSchemaMissing'))
      } else {
        setTestError(result.error || t('settings.supabaseTestFailed'))
      }
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center gap-2">
        <Cloud className="w-5 h-5 text-primary-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('settings.supabaseTitle')}</h3>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.supabaseDesc')}</p>

        {config.source === 'env' ? (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border space-y-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-gray-900 dark:text-white font-mono truncate">{config.url}</code>
              <span className="flex items-center gap-1 text-xs text-primary-500 whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3" />
                .env
              </span>
            </div>
            <p className="text-xs text-gray-400">{t('settings.envConfigured')}</p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.supabaseUrl')}
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setTestResult(null) }}
                placeholder="https://xxxxx.supabase.co"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.supabaseAnonKey')}
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); setTestResult(null) }}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors min-h-tap"
              >
                {t('common.save')}
              </button>
              <button
                onClick={handleTest}
                disabled={testing || (!urlInput.trim() || !keyInput.trim())}
                className="flex-1 px-4 py-3 rounded-xl border border-primary-500 text-primary-600 dark:text-primary-400 text-sm font-medium transition-colors min-h-tap disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('settings.supabaseTest')}
              </button>
            </div>
            {saved && (
              <p className="text-xs text-primary-500">{t('settings.supabaseSaved')}</p>
            )}
          </>
        )}

        <div className="flex items-center gap-2">
          {isCoupleSyncEnabled() || testResult === 'ok' ? (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-3 h-3" />
              {t('settings.supabaseConnected')}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <XCircle className="w-3 h-3" />
              {t('settings.notConfigured')}
            </span>
          )}
        </div>

        {testResult === 'fail' && (
          <p className="text-xs text-red-500">{testError}</p>
        )}

        <details className="text-xs text-gray-500 dark:text-gray-400">
          <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('settings.supabaseSetupGuide')}
          </summary>
          <ol className="list-decimal list-inside space-y-1.5 pl-1">
            <li>{t('settings.supabaseStep1')}</li>
            <li>{t('settings.supabaseStep2')}</li>
            <li>{t('settings.supabaseStep3')}</li>
            <li>{t('settings.supabaseStep4')}</li>
          </ol>
        </details>
      </div>
    </div>
  )
}

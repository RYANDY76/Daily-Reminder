import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App'
import './index.css'
import { migrateStorageKeys, STORAGE_KEYS } from './constants'

migrateStorageKeys()

// Force-unregister any service worker from previous builds
// Prevents stale cache from interfering with dev server HMR
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) reg.unregister()
  })
}

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || ''
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    environment: import.meta.env.PROD ? 'production' : 'development',
    beforeSend(event) {
      const enabled = localStorage.getItem(STORAGE_KEYS.SENTRY_ENABLED)
      if (enabled === 'false') return null
      return event
    }
  })
}

// Capacitor native plugin initialization
async function initCapacitor() {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    const { SplashScreen } = await import('@capacitor/splash-screen')
    const { Keyboard } = await import('@capacitor/keyboard')

    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#121212' })

    await SplashScreen.hide()

    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open')
    })
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open')
    })
  } catch {
    // Not running in Capacitor (browser) — ignore
  }
}
initCapacitor()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)

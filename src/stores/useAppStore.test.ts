import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './useAppStore'
import type { ToastMessage } from '../types'

beforeEach(() => {
  useAppStore.setState({
    currentPage: 'dashboard',
    darkMode: false,
    toastQueue: [],
    lang: 'id',
    globalSearchOpen: false
  })
})

describe('useAppStore', () => {
  it('should have expected initial values', () => {
    const store = useAppStore.getState()
    expect(store.currentPage).toBe('dashboard')
    expect(typeof store.darkMode).toBe('boolean')
    expect(store.toastQueue).toEqual([])
    expect(store.lang).toBe('id')
    expect(store.globalSearchOpen).toBe(false)
  })

  it('should change page with setPage', () => {
    useAppStore.getState().setPage('settings')
    expect(useAppStore.getState().currentPage).toBe('settings')
  })

  it('should add toast to queue', () => {
    const toast: ToastMessage = { id: '1', message: 'Hello', type: 'info' }
    useAppStore.getState().addToast(toast)
    expect(useAppStore.getState().toastQueue).toHaveLength(1)
    expect(useAppStore.getState().toastQueue[0].message).toBe('Hello')
  })

  it('should remove toast from queue', () => {
    const toast1: ToastMessage = { id: '1', message: 'One', type: 'info' }
    const toast2: ToastMessage = { id: '2', message: 'Two', type: 'info' }
    useAppStore.getState().addToast(toast1)
    useAppStore.getState().addToast(toast2)
    useAppStore.getState().removeToast('1')
    expect(useAppStore.getState().toastQueue).toHaveLength(1)
    expect(useAppStore.getState().toastQueue[0].id).toBe('2')
  })

  it('should toggle darkMode', () => {
    useAppStore.setState({ darkMode: false })
    useAppStore.getState().toggleDarkMode()
    expect(useAppStore.getState().darkMode).toBe(true)
    useAppStore.getState().toggleDarkMode()
    expect(useAppStore.getState().darkMode).toBe(false)
  })

  it('should setDarkMode', () => {
    useAppStore.getState().setDarkMode(true)
    expect(useAppStore.getState().darkMode).toBe(true)
    useAppStore.getState().setDarkMode(false)
    expect(useAppStore.getState().darkMode).toBe(false)
  })

  it('should set language with setLang', () => {
    useAppStore.getState().setLang('en')
    expect(useAppStore.getState().lang).toBe('en')
    useAppStore.getState().setLang('id')
    expect(useAppStore.getState().lang).toBe('id')
  })

  it('should set globalSearchOpen', () => {
    useAppStore.getState().setGlobalSearchOpen(true)
    expect(useAppStore.getState().globalSearchOpen).toBe(true)
    useAppStore.getState().setGlobalSearchOpen(false)
    expect(useAppStore.getState().globalSearchOpen).toBe(false)
  })

  it('should handle multiple setPage calls', () => {
    useAppStore.getState().setPage('settings')
    expect(useAppStore.getState().currentPage).toBe('settings')
    useAppStore.getState().setPage('calendar')
    expect(useAppStore.getState().currentPage).toBe('calendar')
    useAppStore.getState().setPage('dashboard')
    expect(useAppStore.getState().currentPage).toBe('dashboard')
  })
})

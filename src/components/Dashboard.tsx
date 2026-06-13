import { useEffect, useRef, useState, useCallback } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import { useRecurringStore } from '../stores/useRecurringStore'
import { useProfileStore } from '../stores/useProfileStore'
import { useAppStore } from '../stores/useAppStore'
import { useNotifications } from '../hooks/useNotifications'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useHaptic } from '../hooks/useHaptic'
import { useToast } from '../hooks/useToast'
import { useConfirm } from '../hooks/useConfirm'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { usePerformance } from '../hooks/usePerformance'
import { useOffline } from '../hooks/useOffline'
import { getUserMessage } from '../utils/errorHandler'
import { getHabitsForProfile } from '../database'
import type { Habit } from '../types'
import { SESSION_ORDER, type SessionType } from '../types'
import { useT } from '../i18n'
import { getSessionFromHour } from '../dates'
import SessionCard from './SessionCard'
import DailyPlan from './DailyPlan'
import Archive from './Archive'
import MoodWidget from './MoodWidget'
import WeeklyReview from './WeeklyReview'
import TaskForm from './TaskForm'
import LoadingOverlay from './LoadingOverlay'
import { DashboardSkeleton } from './Skeleton'
import { Search, ArchiveIcon, WifiOff, Sun, Sunrise, Sunset, Moon } from 'lucide-react'

// Sub-components
import DashboardHeader from './dashboard/DashboardHeader'
import SearchBar from './dashboard/SearchBar'
import StatCards from './dashboard/StatCards'
import ProgressBar from './dashboard/ProgressBar'
import BatchModeBar from './dashboard/BatchModeBar'
import OverdueWarning from './dashboard/OverdueWarning'

import type { LucideIcon } from 'lucide-react'

export default function Dashboard() {
  const t = useT()
  const sessionIcons: Record<SessionType, { Icon: LucideIcon; label: string }> = {
    pagi:  { Icon: Sunrise, label: t('session.pagi') },
    siang: { Icon: Sun,     label: t('session.siang') },
    sore:  { Icon: Sunset,  label: t('session.sore') },
    malam: { Icon: Moon,    label: t('session.malam') },
  }
  usePerformance('Dashboard', import.meta.env.DEV)
  
  const todayTasks = useTaskStore((s) => s.todayTasks)
  const loadTodayTasks = useTaskStore((s) => s.loadTodayTasks)
  const checkDayChange = useTaskStore((s) => s.checkDayChange)
  const checkAndGenerate = useRecurringStore((s) => s.checkAndGenerate)
  const currentProfile = useProfileStore((s) => s.currentProfile)
  const notificationEnabled = useAppStore((s) => s.notificationEnabled)
  const addTaskRequestId = useAppStore((s) => s.addTaskRequestId)
  const { trigger } = useHaptic()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const { checkAndNotify, requestPermission, updatePrefs } = useNotifications()
  const setNotificationEnabled = useAppStore((s) => s.setNotificationEnabled)

  const handleRequestPermission = useCallback(async () => {
    const ok = await requestPermission()
    if (ok) {
      updatePrefs({ enabled: true })
      setNotificationEnabled(true)
    }
  }, [requestPermission, updatePrefs, setNotificationEnabled])
  const { isOffline, queueToggleDone, queueDelete } = useOffline()
  const notifiedRef = useRef(false)
  const [habits, setHabits] = useState<Habit[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showArchive, setShowArchive] = useState(false)
  const taskStoreLoading = useTaskStore((s) => s.loading)
  const [initialLoading, setInitialLoading] = useState(
    () => todayTasks.length === 0 && (taskStoreLoading || !currentProfile)
  )
  const [showAddTask, setShowAddTask] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearchShortcut = useCallback(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleNewTaskShortcut = useCallback(() => {
    setShowAddTask(true)
  }, [])

  useEffect(() => {
    if (addTaskRequestId > 0) setShowAddTask(true)
  }, [addTaskRequestId])

  const handleCloseModal = useCallback(() => {
    setShowAddTask(false)
    setShowArchive(false)
  }, [])

  const toggleBatchMode = () => {
    setBatchMode(!batchMode)
    setSelectedTasks(new Set())
  }

  const toggleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const selectAllTasks = () => {
    const newSelected = new Set(filteredTasks.map(t => t.id))
    setSelectedTasks(newSelected)
  }

  const deselectAllTasks = () => {
    setSelectedTasks(new Set())
  }

  const handleBatchMarkDone = async () => {
    if (isOffline) {
      queueToggleDone([...selectedTasks], true)
      success(t('batch.markedDone', { count: selectedTasks.size }))
      setSelectedTasks(new Set())
      setBatchMode(false)
      return
    }

    await executeBatchMarkDone()
  }

  const executeBatchMarkDone = async () => {
    try {
      setBatchLoading(true)
      const toggleTaskDone = useTaskStore.getState().toggleTaskDone
      for (const taskId of selectedTasks) {
        const task = todayTasks.find(t => t.id === taskId)
        if (task && !task.done) {
          await toggleTaskDone(taskId)
        }
      }
      trigger('medium')
      success(t('batch.markedDone', { count: selectedTasks.size }))
      setSelectedTasks(new Set())
      setBatchMode(false)
    } catch (err) {
      showError(getUserMessage(err, t))
    } finally {
      setBatchLoading(false)
    }
  }

  const handleBatchMarkUndone = async () => {
    if (isOffline) {
      queueToggleDone([...selectedTasks], false)
      success(t('batch.markedUndone', { count: selectedTasks.size }))
      setSelectedTasks(new Set())
      setBatchMode(false)
      return
    }

    await executeBatchMarkUndone()
  }

  const executeBatchMarkUndone = async () => {
    try {
      setBatchLoading(true)
      const toggleTaskDone = useTaskStore.getState().toggleTaskDone
      for (const taskId of selectedTasks) {
        const task = todayTasks.find(t => t.id === taskId)
        if (task && task.done) {
          await toggleTaskDone(taskId)
        }
      }
      trigger('medium')
      success(t('batch.markedUndone', { count: selectedTasks.size }))
      setSelectedTasks(new Set())
      setBatchMode(false)
    } catch (err) {
      showError(getUserMessage(err, t))
    } finally {
      setBatchLoading(false)
    }
  }

  const handleBatchDelete = async () => {
    const ok = await confirm({ title: t('common.confirm'), message: t('batch.deleteConfirm', { count: selectedTasks.size }), variant: 'danger', confirmText: t('common.delete'), cancelText: t('common.cancel') })
    if (!ok) return
    
    if (isOffline) {
      queueDelete([...selectedTasks])
      success(t('batch.deleted', { count: selectedTasks.size }))
      setSelectedTasks(new Set())
      setBatchMode(false)
      return
    }

    await executeBatchDelete()
  }

  const executeBatchDelete = async () => {
    try {
      setBatchLoading(true)
      const removeTask = useTaskStore.getState().removeTask
      for (const taskId of selectedTasks) {
        await removeTask(taskId)
      }
      trigger('heavy')
      success(t('batch.deleted', { count: selectedTasks.size }))
      setSelectedTasks(new Set())
      setBatchMode(false)
    } catch (err) {
      showError(getUserMessage(err, t))
    } finally {
      setBatchLoading(false)
    }
  }

  const refreshTasks = useCallback(async () => {
    try {
      trigger('light')
      if (currentProfile) {
        await checkDayChange()
          .then(() => checkAndGenerate())
          .then(() => loadTodayTasks())
        success(t('dashboard.tasksUpdated'))
      }
    } catch (err) {
      showError(getUserMessage(err, t))
    }
  }, [currentProfile, checkDayChange, checkAndGenerate, loadTodayTasks, trigger, success, showError, t])

  const { containerRef } = usePullToRefresh({
    onRefresh: refreshTasks,
    enabled: true
  })

  useKeyboardShortcuts({
    onSearch: handleSearchShortcut,
    onNewTask: handleNewTaskShortcut,
    onCloseModal: handleCloseModal
  })

  useEffect(() => {
    if (currentProfile) {
      // If tasks were already pre-loaded by App.tsx, just clear loading state
      const storeState = useTaskStore.getState()
      if (storeState.todayTasks.length > 0 || !storeState.loading) {
        setInitialLoading(false)
        return
      }
      // Otherwise do a fresh load (fallback for edge cases)
      checkDayChange()
        .then(() => checkAndGenerate())
        .then(() => loadTodayTasks())
        .then(() => setInitialLoading(false))
        .catch(() => {
          loadTodayTasks().finally(() => setInitialLoading(false))
        })
    }
  }, [currentProfile])

  useEffect(() => {
    if (!currentProfile) return
    getHabitsForProfile(currentProfile.id).then(setHabits)
  }, [currentProfile?.id])

  useEffect(() => {
    if (todayTasks.length > 0 && !notifiedRef.current) {
      checkAndNotify(todayTasks)
      notifiedRef.current = true
    }
  }, [todayTasks, checkAndNotify])

  useEffect(() => {
    const handler = () => {
      if (todayTasks.length > 0) checkAndNotify(todayTasks)
    }
    window.addEventListener('check-notifications', handler)
    return () => window.removeEventListener('check-notifications', handler)
  }, [todayTasks, habits, checkAndNotify, currentProfile?.id])

  useEffect(() => {
    const interval = setInterval(() => loadTodayTasks(), 60000)
    return () => clearInterval(interval)
  }, [loadTodayTasks])

  const totalDone = todayTasks.filter((t) => t.done).length
  const totalTasks = todayTasks.length
  const progress = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0
  const allTags = [...new Set(todayTasks.flatMap(t => t.tags || []))].sort()
  const filteredTasks = todayTasks.filter(t => {
    if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (selectedTag && !(t.tags || []).includes(selectedTag)) return false
    return true
  })
  const missed = todayTasks.filter((t) => t.status === 'missed').length
  const pending = todayTasks.filter((t) => !t.done && t.status !== 'missed').length

  if (initialLoading) return <DashboardSkeleton />

  return showArchive ? (
    <div className="space-y-5">
      <button
        onClick={() => setShowArchive(false)}
        className="text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors flex items-center gap-1"
      >
        &larr; {t('common.back')}
      </button>
      <Archive />
    </div>
  ) : (
    <>
      <ConfirmDialog />
      {batchLoading && <LoadingOverlay message={t('dashboard.batchProcessing')} transparent />}
      
      {isOffline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-500 text-white px-4 py-2 rounded-2xl shadow-elevated flex items-center gap-2 text-sm font-medium animate-slide-in-down">
          <WifiOff className="w-4 h-4" />
          <span>{t('dashboard.offlineBanner')}</span>
        </div>
      )}
      
      <div className="space-y-5 pb-32 md:pb-0">
        {batchMode && (
          <BatchModeBar
            selectedTasks={selectedTasks}
            onDeselectAll={deselectAllTasks}
            onToggleBatchMode={toggleBatchMode}
            onSelectAll={selectAllTasks}
            onMarkDone={handleBatchMarkDone}
            onMarkUndone={handleBatchMarkUndone}
            onDelete={handleBatchDelete}
          />
        )}

        <DashboardHeader
          profileName={currentProfile?.name}
          totalTasks={totalTasks}
          batchMode={batchMode}
          notificationEnabled={notificationEnabled}
          profileId={currentProfile?.id ?? null}
          onToggleBatchMode={toggleBatchMode}
          onShowAddTask={() => setShowAddTask(true)}
          onRequestNotificationPermission={handleRequestPermission}
        />

        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchInputRef={searchInputRef}
          allTags={allTags}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
        />

        <StatCards
          totalTasks={totalTasks}
          totalDone={totalDone}
          pending={pending}
          missed={missed}
        />

        <ProgressBar
          progress={progress}
          totalTasks={totalTasks}
          totalDone={totalDone}
        />

        <button
          onClick={() => setShowArchive(true)}
          className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
        >
          <ArchiveIcon className="w-4 h-4" />
          {t('dashboard.archive')}
        </button>

        <DailyPlan
          tasks={filteredTasks}
          onApplyTime={(taskId, time) => {
            const task = todayTasks.find(t => t.id === taskId)
            if (!task) return
            const session = getSessionFromHour(parseInt(time.split(':')[0], 10))
            useTaskStore.getState().updateTask(taskId, { time, session })
              .then(() => loadTodayTasks())
          }}
        />
        <MoodWidget />
        <WeeklyReview />

        <div className="space-y-3 xl:grid xl:grid-cols-2 xl:gap-3 xl:space-y-0" ref={containerRef}>
          {SESSION_ORDER.map((session) => {
            const sessionTasks = filteredTasks.filter((t) => t.session === session)
            if (searchQuery && sessionTasks.length === 0) return null
            return (
              <SessionCard
                key={session}
                session={session}
                tasks={sessionTasks}
                icon={sessionIcons[session]}
                batchMode={batchMode}
                selectedTasks={selectedTasks}
                onToggleSelect={toggleSelectTask}
              />
            )
          })}
        </div>

        {!searchQuery && <OverdueWarning tasks={todayTasks} />}

        {searchQuery && filteredTasks.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {t('dashboard.noResults', { query: searchQuery })}
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="btn-ghost mt-2 text-sm"
            >
              {t('dashboard.clearSearch')}
            </button>
          </div>
        )}

        {showAddTask && <TaskForm onClose={() => setShowAddTask(false)} />}
      </div>
    </>
  )
}

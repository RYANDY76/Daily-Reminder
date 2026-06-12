import { useState, useEffect } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useCoupleStore } from '../stores/useCoupleStore'
import { useToast } from '../hooks/useToast'
import { useConfirm } from '../hooks/useConfirm'
import { useT } from '../i18n'
import { isCoupleSyncEnabled } from '../services/coupleSync'
import { useAuthStore } from '../stores/useAuthStore'
import { getCoupleStatsCounts } from '../database-couple'
import { Heart, Copy, Check, Users, Link as LinkIcon, UserPlus, X, Cloud, CloudOff } from 'lucide-react'

export default function CoupleConnect() {
  const t = useT()
  const currentProfile = useProfileStore(s => s.currentProfile)
  const connection = useCoupleStore(s => s.connection)
  const goals = useCoupleStore(s => s.goals)
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [inviteCode, setInviteCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sharedTaskCount, setSharedTaskCount] = useState(0)
  const session = useAuthStore(s => s.session)
  const cloudSync = isCoupleSyncEnabled()

  useEffect(() => {
    if (!connection?.id) return
    getCoupleStatsCounts(connection.id).then(({ sharedTasks }) => {
      setSharedTaskCount(sharedTasks)
    })
  }, [connection?.id, goals.length])

  const handleCreateConnection = async () => {
    if (!currentProfile) return

    setLoading(true)
    try {
      const code = await useCoupleStore.getState().createConnection(
        currentProfile.id,
        currentProfile.name
      )
      setGeneratedCode(code)
      await useCoupleStore.getState().loadConnection(currentProfile.id)
      success(t('couple.created'))
    } catch {
      showError(t('couple.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleJoinConnection = async () => {
    if (!currentProfile || !inviteCode.trim()) return

    setLoading(true)
    try {
      const joined = await useCoupleStore.getState().joinConnection(
        inviteCode.toUpperCase(),
        currentProfile.id,
        currentProfile.name
      )

      if (joined) {
        await useCoupleStore.getState().loadConnection(currentProfile.id)
        success(t('couple.joined'))
        setShowModal(false)
        setInviteCode('')
      } else {
        showError(t('couple.invalidCode'))
      }
    } catch {
      showError(t('couple.joinFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = async (code = generatedCode) => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      success(t('couple.codeCopied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showError(t('common.error'))
    }
  }

  const handleDisconnect = async () => {
    const ok = await confirm({ title: t('common.confirm'), message: t('couple.disconnectConfirm'), variant: 'danger', confirmText: t('couple.disconnect'), cancelText: t('common.cancel') })
    if (!ok) return
    await useCoupleStore.getState().disconnect()
    success(t('couple.disconnected'))
  }

  if (connection && connection.status === 'active') {
    const partnerName = useCoupleStore.getState().getPartnerName(currentProfile?.id || '')

    return (
      <>
      <ConfirmDialog />
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('couple.connectedWith')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{partnerName}</p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            {t('couple.disconnect')}
          </button>
        </div>

        <div className={`flex items-center gap-2 mb-3 text-xs ${cloudSync ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {cloudSync ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
          <span>{cloudSync ? t('couple.cloudSyncOn') : t('couple.cloudSyncOff')}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-pink-50 dark:bg-pink-900/10 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('couple.sharedTasks')}</p>
            <p className="text-xl font-bold text-pink-600 dark:text-pink-400">{sharedTaskCount}</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('couple.coupleGoals')}</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{goals.length}</p>
          </div>
        </div>
      </div>
    </>
    )
  }

  if (connection && connection.status === 'pending') {
    const pendingCode = connection.inviteCode || generatedCode

    return (
      <div className="card p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <LinkIcon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('couple.pendingTitle')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('couple.pendingDesc')}</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 mb-4 text-xs ${cloudSync ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {cloudSync ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
          <span>{cloudSync ? t('couple.cloudSyncOn') : t('couple.cloudSyncOff')}</span>
        </div>

        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 rounded-lg border-2 border-dashed border-pink-300 dark:border-pink-700 mb-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">{t('couple.shareCode')}</p>
          <p className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 tracking-wider">
            {pendingCode || '------'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => void handleCopyCode(pendingCode)}
            disabled={!pendingCode}
            className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? t('couple.copied') : t('couple.copyCode')}
          </button>
          <button
            onClick={handleDisconnect}
            className="px-4 py-3 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            {t('couple.cancelInvite')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card p-5">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-pink-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('couple.connectTitle')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('couple.connectDesc')}</p>
          {cloudSync && (
            <p className={`text-xs mb-4 ${session ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {session ? t('couple.cloudSyncOn') : t('couple.cloudSyncOff')}
            </p>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all shadow-sm"
          >
            {t('couple.getStarted')}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('couple.connectTitle')}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-dark-bg rounded-xl">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === 'create'
                    ? 'bg-white dark:bg-dark-card text-pink-600 dark:text-pink-400 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                <LinkIcon className="w-4 h-4 inline mr-1" />
                {t('couple.createCode')}
              </button>
              <button
                onClick={() => setMode('join')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === 'join'
                    ? 'bg-white dark:bg-dark-card text-pink-600 dark:text-pink-400 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-1" />
                {t('couple.joinCode')}
              </button>
            </div>

            {mode === 'create' ? (
              <div className="space-y-4">
                {generatedCode ? (
                  <>
                    <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 rounded-lg border-2 border-dashed border-pink-300 dark:border-pink-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">{t('couple.shareCode')}</p>
                      <p className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 tracking-wider">
                        {generatedCode}
                      </p>
                    </div>
                    <button
                      onClick={() => void handleCopyCode()}
                      className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copied ? t('couple.copied') : t('couple.copyCode')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCreateConnection}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {loading ? t('common.loading') : t('couple.generateCode')}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white uppercase"
                />
                <button
                  onClick={handleJoinConnection}
                  disabled={loading || inviteCode.length < 6}
                  className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {loading ? t('common.loading') : t('couple.joinPartner')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

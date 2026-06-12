import { useState } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { useAppStore } from '../stores/useAppStore'
import { useAuthStore } from '../stores/useAuthStore'
import Avatar from './Avatar'
import { Pencil, Trash2, Plus, Lock, LogOut } from 'lucide-react'
import { useT } from '../i18n'
import { useConfirm } from '../hooks/useConfirm'

export default function ProfileManager() {
  const profiles = useProfileStore((s) => s.profiles)
  const currentProfile = useProfileStore((s) => s.currentProfile)
  const switchProfile = useProfileStore((s) => s.switchProfile)
  const createProfile = useProfileStore((s) => s.createProfile)
  const removeProfile = useProfileStore((s) => s.removeProfile)
  const updateProfile = useProfileStore((s) => s.updateProfile)

  const t = useT()
  const { confirm, ConfirmDialog } = useConfirm()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleSwitch = async (id: string) => {
    if (id === currentProfile?.id) return
    const ok = await confirm({ title: t('common.confirm'), message: t('profile.switchConfirm'), confirmText: t('profile.switch'), cancelText: t('common.cancel') })
    if (!ok) return
    await switchProfile(id)
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    const pin = newPin.length === 4 ? newPin : null
    await createProfile(newName.trim(), pin)
    setNewName('')
    setNewPin('')
    setShowCreate(false)
  }

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({ title: t('common.confirm'), message: t('profile.deleteConfirm', { name }), variant: 'danger', confirmText: t('common.delete'), cancelText: t('common.cancel') })
    if (!ok) return
    await removeProfile(id)
  }

  const handleSignOut = async () => {
    const ok = await confirm({
      title: t('profile.signOutTitle'),
      message: t('profile.signOutMessage'),
      variant: 'danger',
      confirmText: t('profile.signOut'),
      cancelText: t('common.cancel')
    })
    if (!ok) return
    try {
      await useAuthStore.getState().signOut()
    } catch {
      // signOut already handles errors internally
    }
    localStorage.removeItem('daily_reminder_guest')
    localStorage.removeItem('daily_reminder_last_profile')
    window.location.reload()
  }

  const handleSaveEdit = async (_id: string) => {
    if (!editName.trim()) return
    await updateProfile({ name: editName.trim() })
    setEditingId(null)
  }

  return (
    <>
      <ConfirmDialog />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h2>
        {profiles.length < 5 && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors min-h-tap flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('profile.newProfile')}
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {profiles.map((profile) => {
          const isActive = profile.id === currentProfile?.id
          return (
            <div
              key={profile.id}
              className={`bg-white dark:bg-dark-surface rounded-xl p-4 border transition-all ${
                isActive
                  ? 'border-primary-500 ring-1 ring-primary-500'
                  : 'border-gray-200 dark:border-dark-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar name={profile.name} photoUrl={null} />

                <div className="flex-1 min-w-0">
                  {editingId === profile.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(profile.id)}
                          className="flex-1 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium min-h-tap"
                        >
                          {t('common.save')}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-1.5 border border-gray-300 dark:border-dark-border rounded-lg text-xs font-medium min-h-tap"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                        {profile.name}
                        {profile.pin && <Lock className="w-3 h-3 text-gray-400" />}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('profile.created', { date: new Date(profile.createdAt).toLocaleDateString(useAppStore.getState().lang === 'en' ? 'en-US' : 'id-ID') })}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleSwitch(profile.id)}
                    disabled={isActive}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors min-h-tap ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-primary-50 hover:text-primary-600'
                    }`}
                  >
                    {isActive ? t('profile.active') : t('profile.select')}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(profile.id)
                      setEditName(profile.name)
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-400 min-h-tap min-w-tap flex items-center justify-center"
                    aria-label={t('profile.editName')}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id, profile.name)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 min-h-tap min-w-tap flex items-center justify-center"
                    aria-label={t('profile.deleteProfile')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 text-sm font-medium min-h-tap"
        >
          <LogOut className="w-4 h-4" />
          {t('profile.signOut')}
        </button>
      </div>

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">{t('profile.newProfile')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.nameLabel')}
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('profile.namePlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.pinLabel')}
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium transition-colors min-h-tap"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors min-h-tap"
                >
                  {t('profile.create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

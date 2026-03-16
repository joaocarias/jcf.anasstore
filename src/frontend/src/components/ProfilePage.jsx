import { Loader2, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export default function ProfilePage({ session, token }) {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/Profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      const payload = await response.json()
      setProfile(payload)
    } catch {
      setErrorMessage('Nao foi possivel carregar os dados do perfil.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  function formatDateTime(value) {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '-'
    return parsed.toLocaleString('pt-BR')
  }

  async function handleChangePassword(event) {
    event.preventDefault()
    setSaveError('')
    setSaveMessage('')

    if (!currentPassword || !newPassword) {
      setSaveError('Informe a senha atual e a nova senha.')
      return
    }

    if (newPassword !== confirmPassword) {
      setSaveError('A confirmacao da senha nao confere.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Profile/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!response.ok) {
        let payload = null
        try {
          payload = await response.json()
        } catch {
          payload = null
        }
        const message =
          payload?.message ||
          (Array.isArray(payload?.errors) && payload.errors.length > 0 ? payload.errors.join(' ') : null) ||
          'Nao foi possivel alterar a senha.'
        setSaveError(message)
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSaveMessage('Senha atualizada com sucesso.')
    } catch {
      setSaveError('Nao foi possivel alterar a senha.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Perfil do Usuario</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Informacoes basicas da conta autenticada.</p>
      </header>

      {errorMessage && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Nome</p>
          <p className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            {profile?.name ?? session?.displayName ?? '-'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</p>
          <p className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            {profile?.email ?? session?.email ?? '-'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Perfil</p>
          <p className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">{profile?.roleName ?? '-'}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Data de Criacao</p>
          <p className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : formatDateTime(profile?.createAt)}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
        <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">Trocar senha</h3>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleChangePassword}>
          <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
            Senha atual
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
          <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
            Nova senha
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
          <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
            Confirmar nova senha
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>

          {saveError && (
            <p className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {saveError}
            </p>
          )}
          {saveMessage && (
            <p className="md:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              {saveMessage}
            </p>
          )}

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-70"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isSaving ? 'Salvando...' : 'Salvar senha'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

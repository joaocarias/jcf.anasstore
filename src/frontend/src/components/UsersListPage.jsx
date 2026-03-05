import { KeyRound, Loader2, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const EMPTY_FORM = {
  name: '',
  email: '',
  roleName: 'Basic',
}

const FALLBACK_ROLES = ['Admin', 'Manager', 'Auditor', 'Seller', 'Basic']

function formatDateTime(value) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString('pt-BR')
}

function getRoleBadgeClass(roleName) {
  switch ((roleName ?? '').toLowerCase()) {
    case 'admin':
      return 'bg-red-100 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800'
    case 'manager':
      return 'bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-800'
    case 'auditor':
      return 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800'
    case 'seller':
      return 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
  }
}

export default function UsersListPage({ token }) {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState(FALLBACK_ROLES)
  const [searchNameInput, setSearchNameInput] = useState('')
  const [searchName, setSearchName] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUserUid, setEditingUserUid] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [deletingUserUid, setDeletingUserUid] = useState(null)
  const [userPendingDelete, setUserPendingDelete] = useState(null)
  const [resettingUserUid, setResettingUserUid] = useState(null)
  const [userPendingReset, setUserPendingReset] = useState(null)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / pageSize)), [pageSize, totalItems])

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(pageSize),
      })

      const response = await fetch(`${API_BASE_URL}/Users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setErrorMessage('Você não possui acesso para realizar esta ação.')
          setUsers([])
          setTotalItems(0)
          return
        }
        throw new Error('failed')
      }

      const payload = await response.json()
      let items = Array.isArray(payload?.items) ? payload.items : []

      if (searchName.trim().length > 0) {
        const text = searchName.trim().toLowerCase()
        items = items.filter((x) => (x.name ?? '').toLowerCase().includes(text))
      }

      setUsers(items)
      setTotalItems(typeof payload?.total === 'number' ? payload.total : 0)
    } catch {
      setErrorMessage('Não foi possível carregar a lista de usuários.')
      setUsers([])
      setTotalItems(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, searchName, token])

  const loadRoles = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Roles?page=1&pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        return
      }

      const payload = await response.json()
      const names = (Array.isArray(payload?.items) ? payload.items : [])
        .map((x) => x.name)
        .filter((x) => typeof x === 'string')

      if (names.length > 0) {
        setRoles(names)
      }
    } catch {
      setRoles(FALLBACK_ROLES)
    }
  }, [token])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  function handleSearchUsers() {
    setCurrentPage(1)
    setSearchName(searchNameInput.trim())
  }

  function handleInputChange(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function handleOpenCreate() {
    setFormData({
      ...EMPTY_FORM,
      roleName: roles[0] ?? 'Basic',
    })
    setEditingUserUid(null)
    setSaveErrorMessage('')
    setSuccessMessage('')
    setIsFormOpen(true)
  }

  function handleCloseForm() {
    if (isSaving) return
    setIsFormOpen(false)
    setEditingUserUid(null)
    setSaveErrorMessage('')
  }

  async function handleOpenEdit(userUid) {
    setErrorMessage('')
    setSuccessMessage('')
    setSaveErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/Users/${userUid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      const payload = await response.json()
      setFormData({
        name: payload?.name ?? '',
        email: payload?.email ?? '',
        roleName: payload?.roles?.[0] ?? roles[0] ?? 'Basic',
      })
      setEditingUserUid(userUid)
      setIsFormOpen(true)
    } catch {
      setErrorMessage('Não foi possível carregar os dados para edição.')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setSaveErrorMessage('')

    const isEditing = Boolean(editingUserUid)
    const payload = isEditing
      ? {
          name: formData.name.trim() || null,
          email: formData.email.trim() || null,
          roleName: formData.roleName || null,
          isActive: true,
        }
      : {
          name: formData.name.trim(),
          email: formData.email.trim(),
          roleName: formData.roleName,
          isActive: true,
        }

    try {
      const response = await fetch(
        isEditing ? `${API_BASE_URL}/Users/${editingUserUid}` : `${API_BASE_URL}/Users`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        let message = isEditing ? 'Não foi possível atualizar o usuário.' : 'Não foi possível criar o usuário.'
        try {
          const payloadError = await response.json()
          if (payloadError?.message) {
            message = payloadError.message
          } else if (Array.isArray(payloadError?.errors) && payloadError.errors.length > 0) {
            message = payloadError.errors.join(' ')
          }
        } catch {
          // ignore
        }
        setSaveErrorMessage(message)
        return
      }

      const responsePayload = await response.json().catch(() => null)
      handleCloseForm()
      await loadUsers()
      if (!isEditing && responsePayload?.generatedPassword) {
        setSuccessMessage(`Usuário criado. Senha inicial: ${responsePayload.generatedPassword}`)
      } else if (!isEditing) {
        setSuccessMessage('Usuário criado com sucesso.')
      }
    } catch {
      setSaveErrorMessage(isEditing ? 'Não foi possível atualizar o usuário.' : 'Não foi possível criar o usuário.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleRequestReset(user) {
    setUserPendingReset(user)
  }

  function handleCloseResetModal() {
    if (resettingUserUid) return
    setUserPendingReset(null)
  }

  async function handleConfirmResetPassword() {
    if (!userPendingReset?.uid) return

    setResettingUserUid(userPendingReset.uid)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/Users/${userPendingReset.uid}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        let message = 'Não foi possível resetar a senha.'
        try {
          const payloadError = await response.json()
          if (payloadError?.message) {
            message = payloadError.message
          } else if (Array.isArray(payloadError?.errors) && payloadError.errors.length > 0) {
            message = payloadError.errors.join(' ')
          }
        } catch {
          // ignore
        }
        setErrorMessage(message)
        return
      }

      const payload = await response.json().catch(() => null)
      if (payload?.generatedPassword) {
        setSuccessMessage(`Senha resetada: ${payload.generatedPassword}`)
      } else {
        setSuccessMessage('Senha resetada com sucesso.')
      }
      setUserPendingReset(null)
    } catch {
      setErrorMessage('Não foi possível resetar a senha.')
    } finally {
      setResettingUserUid(null)
    }
  }

  function handleRequestDelete(user) {
    setUserPendingDelete(user)
  }

  function handleCloseDeleteModal() {
    if (deletingUserUid) return
    setUserPendingDelete(null)
  }

  async function handleConfirmDelete() {
    if (!userPendingDelete?.uid) return

    setDeletingUserUid(userPendingDelete.uid)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/Users/${userPendingDelete.uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      setUserPendingDelete(null)
      await loadUsers()
    } catch {
      setErrorMessage('Não foi possível excluir o usuário.')
    } finally {
      setDeletingUserUid(null)
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Usuários</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchNameInput}
            onChange={(event) => setSearchNameInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSearchUsers()
              }
            }}
            placeholder="Buscar por nome"
            className="w-52 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={handleSearchUsers}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-900/30"
          >
            <Search size={16} />
            Pesquisar
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700"
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>
      </header>

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando usuários...</p>}

      {!isLoading && errorMessage && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      {!isLoading && !errorMessage && successMessage && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {successMessage}
        </p>
      )}

      {!isLoading && !errorMessage && (
        <div className="grid gap-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="py-2 pr-3">Nome</th>
                  <th className="py-2 pr-3">E-mail</th>
                  <th className="py-2 pr-3">Perfil</th>
                  <th className="py-2 pr-3">Criado em</th>
                  <th className="py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uid} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2 pr-3 font-semibold text-gray-800 dark:text-gray-200">{user.name}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{user.email}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                      <div className="flex flex-wrap gap-1">
                        {(user.roles?.length ? user.roles : ['Sem perfil']).map((role) => (
                          <span
                            key={`${user.uid}-${role}`}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${getRoleBadgeClass(role)}`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{formatDateTime(user.createAt)}</td>
                    <td className="py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(user.uid)}
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestReset(user)}
                          disabled={resettingUserUid === user.uid}
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-amber-500 hover:text-amber-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-amber-500 dark:hover:text-amber-400"
                          title="Resetar senha"
                        >
                          {resettingUserUid === user.uid ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(user)}
                          disabled={deletingUserUid === user.uid}
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-red-500 hover:text-red-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-red-500 dark:hover:text-red-400"
                          title="Excluir"
                        >
                          {deletingUserUid === user.uid ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-300">
            <span>Total: {totalItems} | Página: {currentPage} | Por página: {pageSize}</span>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editingUserUid ? 'Editar Usuário' : 'Adicionar Usuário'}
              </h3>
            </header>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Nome
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => handleInputChange('name', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>

                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  E-mail
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => handleInputChange('email', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Perfil
                  <select
                    value={formData.roleName}
                    onChange={(event) => handleInputChange('roleName', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {saveErrorMessage && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {saveErrorMessage}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userPendingReset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirmar reset de senha</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Deseja resetar a senha do usuário <strong>{userPendingReset.name}</strong>?
              </p>
            </header>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseResetModal}
                disabled={Boolean(resettingUserUid)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                disabled={Boolean(resettingUserUid)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {resettingUserUid ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                {resettingUserUid ? 'Resetando...' : 'Resetar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {userPendingDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirmar exclusão</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Deseja realmente excluir o usuário <strong>{userPendingDelete.name}</strong>?
              </p>
            </header>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={Boolean(deletingUserUid)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingUserUid)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deletingUserUid ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deletingUserUid ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

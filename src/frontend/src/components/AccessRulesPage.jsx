import { ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

function roleBadgeClass(roleName) {
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

export default function AccessRulesPage({ token }) {
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadRoles = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/Roles?page=1&pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setErrorMessage('Você não possui acesso para realizar esta ação.')
          setRoles([])
          return
        }

        throw new Error('failed')
      }

      const payload = await response.json()
      const items = Array.isArray(payload?.items) ? payload.items : []
      setRoles(items)
    } catch {
      setErrorMessage('Não foi possível carregar as regras de acesso.')
      setRoles([])
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Regras de Acesso</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Perfis de usuário (roles) cadastrados no sistema.
        </p>
      </header>

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando regras de acesso...</p>}

      {!isLoading && errorMessage && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      {!isLoading && !errorMessage && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Identificador</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.uid} className="border-b border-gray-50 dark:border-gray-800">
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${roleBadgeClass(role.name)}`}
                    >
                      <ShieldCheck size={12} />
                      {role.name}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{role.uid}</td>
                </tr>
              ))}

              {roles.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                    Nenhuma regra de acesso encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

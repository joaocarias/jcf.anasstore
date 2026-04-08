import { CreditCard, History, PackagePlus, ShoppingCart, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Charts from './Charts'
import DashboardCards from './DashboardCards'
import LatestProductsTable from './LatestProductsTable'
import SalesTable from './SalesTable'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export default function DashboardHome({ token, onNavigate }) {
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const actions = useMemo(
    () => [
      {
        key: 'new-sale',
        label: 'Nova venda',
        description: 'Registrar venda agora',
        icon: ShoppingCart,
        target: 'new-sale',
      },
      {
        key: 'new-customer',
        label: 'Novo cliente',
        description: 'Cadastrar novo cliente',
        icon: UserPlus,
        target: 'customers',
      },
      {
        key: 'new-product',
        label: 'Novo produto',
        description: 'Adicionar produto',
        icon: PackagePlus,
        target: 'products',
      },
      {
        key: 'sales-history',
        label: 'Historico de vendas',
        description: 'Consultar vendas',
        icon: History,
        target: 'sales-history',
      },
      {
        key: 'payment-methods',
        label: 'Formas de pagamento',
        description: 'Configurar formas',
        icon: CreditCard,
        target: 'payment-methods',
      },
    ],
    []
  )

  const loadSummary = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/Dashboard?latestSales=5&latestProducts=5`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      const payload = await response.json()
      setSummary(payload)
    } catch {
      setSummary(null)
      setErrorMessage('Nao foi possivel carregar o resumo do dashboard.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  return (
    <section className="space-y-6">
      <section className="rounded-2xl bg-white p-3 sm:p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
        <header className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Acesso rápido</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Principais ações para agilizar o dia a dia.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => onNavigate?.(action.target)}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 text-left text-xs transition hover:border-blue-500 hover:bg-blue-50 sm:px-4 sm:text-sm dark:border-gray-800 dark:hover:border-blue-500/70 dark:hover:bg-blue-950/30"
              >
                <span className="rounded-xl bg-blue-50 p-2 text-blue-600 transition group-hover:bg-white dark:bg-blue-950 dark:text-blue-300">
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-gray-900 dark:text-gray-100">{action.label}</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">{action.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <DashboardCards summary={summary} isLoading={isLoading} />

      {errorMessage && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-6 2xl:grid-cols-2">
        <SalesTable
          sales={summary?.latestSales ?? []}
          isLoading={isLoading}
          onViewAll={() => onNavigate?.('sales-history')}
        />
        <LatestProductsTable
          products={summary?.latestProducts ?? []}
          isLoading={isLoading}
          onViewAll={() => onNavigate?.('products')}
        />
      </div>

      <Charts />
    </section>
  )
}

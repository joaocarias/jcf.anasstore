import { ChevronLeft, ChevronRight, Eye, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export default function SalesHistoryPage({ token }) {
  const [sales, setSales] = useState([])
  const [customers, setCustomers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [saleSummary, setSaleSummary] = useState(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedCustomerUid, setSelectedCustomerUid] = useState('')

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / pageSize)), [pageSize, totalItems])

  const loadCustomers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Customers?page=1&pageSize=500`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        return
      }
      const payload = await response.json()
      setCustomers(Array.isArray(payload?.items) ? payload.items : [])
    } catch {
      setCustomers([])
    }
  }, [token])

  const loadSales = useCallback(async (pageOverride) => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const params = new URLSearchParams({
        page: String(pageOverride ?? currentPage),
        pageSize: String(pageSize),
      })

      if (selectedCustomerUid) {
        params.set('customerUid', selectedCustomerUid)
      }

      if (startDate) {
        params.set('startDate', startDate)
      }

      if (endDate) {
        params.set('endDate', endDate)
      }

      const response = await fetch(`${API_BASE_URL}/Sales?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setErrorMessage('Voce nao possui acesso para visualizar este historico.')
          setSales([])
          setTotalItems(0)
          return
        }
        throw new Error('failed')
      }

      const payload = await response.json()
      setSales(Array.isArray(payload?.items) ? payload.items : [])
      setTotalItems(typeof payload?.total === 'number' ? payload.total : 0)
    } catch {
      setErrorMessage('Nao foi possivel carregar o historico de vendas.')
      setSales([])
      setTotalItems(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, endDate, pageSize, selectedCustomerUid, startDate, token])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  function handleFilterSubmit(event) {
    event.preventDefault()
    const nextPage = 1
    setCurrentPage(nextPage)
    loadSales(nextPage)
  }

  function formatDateTime(value) {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '-'
    return parsed.toLocaleString('pt-BR')
  }

  async function handleOpenSummary(uid) {
    setIsSummaryOpen(true)
    setIsSummaryLoading(true)
    setSummaryError('')
    try {
      const response = await fetch(`${API_BASE_URL}/Sales/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        setSummaryError('Nao foi possivel carregar o resumo da venda.')
        setSaleSummary(null)
        return
      }

      const payload = await response.json()
      setSaleSummary(payload)
    } catch {
      setSummaryError('Nao foi possivel carregar o resumo da venda.')
      setSaleSummary(null)
    } finally {
      setIsSummaryLoading(false)
    }
  }

  function handleCloseSummary() {
    setIsSummaryOpen(false)
    setSaleSummary(null)
    setSummaryError('')
  }

  return (
    <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Historico de Vendas</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Lista de vendas finalizadas.</p>
      </header>

      <form className="mb-4 grid gap-3 rounded-xl border border-gray-200 p-4 text-sm dark:border-gray-800" onSubmit={handleFilterSubmit}>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
            Cliente
            <select
              value={selectedCustomerUid}
              onChange={(event) => setSelectedCustomerUid(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Todos</option>
              {customers.map((customer) => (
                <option key={customer.uid} value={customer.uid}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
            Data inicial
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
          <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
            Data final
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-blue-700"
          >
            <Search size={14} />
            Filtrar
          </button>
        </div>
      </form>

      {errorMessage && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            Carregando vendas...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 text-right">Resumo</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.uid} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2 pr-3">{formatDateTime(sale.createAt)}</td>
                    <td className="py-2 pr-3 font-semibold text-gray-800 dark:text-gray-200">{sale.customerName}</td>
                    <td className="py-2 pr-3">
                      {Number(sale.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenSummary(sale.uid)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 transition hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200"
                      >
                        <Eye size={14} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                      Nenhuma venda encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Total: {totalItems} | Pagina: {currentPage} | Por pagina: {pageSize}</span>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <span className="inline-flex items-center gap-2">
                <ChevronLeft size={14} /> Anterior
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <span className="inline-flex items-center gap-2">
                Proxima <ChevronRight size={14} />
              </span>
            </button>
          </div>
        </div>
      )}

      {isSummaryOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl dark:bg-gray-900">
            <header className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Resumo da Venda</h3>
            </header>

            {isSummaryLoading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Carregando resumo...</p>
            )}

            {!isSummaryLoading && summaryError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {summaryError}
              </p>
            )}

            {!isSummaryLoading && !summaryError && saleSummary && (
              <div className="grid gap-4">
                <section className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Cliente
                  </h4>
                  {saleSummary.customerName ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Nome</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{saleSummary.customerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Telefone</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {saleSummary.customerPhone || '-'}
                          {saleSummary.customerIsWhatsApp ? ' (WhatsApp)' : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Venda avulsa (cliente nao identificado).</p>
                  )}
                </section>

                <section className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Pagamento
                  </h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Forma</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{saleSummary.paymentMethodName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Parcelas</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{saleSummary.installments}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Produtos
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                          <th className="py-2 pr-3">Produto</th>
                          <th className="py-2 pr-3">Qtd</th>
                          <th className="py-2 pr-3">Valor</th>
                          <th className="py-2 pr-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleSummary.items?.map((item) => (
                          <tr key={item.productVariationUid} className="border-b border-gray-50 dark:border-gray-800">
                            <td className="py-2 pr-3 font-semibold text-gray-800 dark:text-gray-200">
                              {item.productName} | {item.colorName} | {item.itemSizeName}
                            </td>
                            <td className="py-2 pr-3">{item.quantity}</td>
                            <td className="py-2 pr-3">
                              {Number(item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="py-2 pr-3">
                              {Number(item.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        ))}
                        {saleSummary.items?.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                              Nenhum produto registrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{Number(saleSummary.subtotalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span>Desconto</span>
                    <span>{Number(saleSummary.discountAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900 dark:border-gray-800 dark:text-gray-100">
                    <span>Total</span>
                    <span>{Number(saleSummary.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </section>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleCloseSummary}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

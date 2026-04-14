import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, Filter, Search } from 'lucide-react'
import { exportSalesReportPdf, formatCurrency } from '../utils/pdfExport'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

function SummaryCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function formatDate(isoStr) {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SalesReportPage({ token }) {
  const [report, setReport] = useState(null)
  const [sellers, setSellers] = useState([])
  const [organization, setOrganization] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [startDate, setStartDate] = useState(firstOfMonth.toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10))
  const [sellerUid, setSellerUid] = useState('')

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  // Load sellers and org info on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const [sellersRes, orgRes] = await Promise.all([
          fetch(`${API_BASE_URL}/Reports/sellers`, { headers: authHeaders }),
          fetch(`${API_BASE_URL}/Organization`, { headers: authHeaders }),
        ])
        if (sellersRes.ok) setSellers(await sellersRes.json())
        if (orgRes.ok) setOrganization(await orgRes.json())
      } catch {
        // non-critical
      }
    }
    loadMeta()
  }, [authHeaders])

  const loadReport = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (sellerUid) params.set('sellerUid', sellerUid)

      const res = await fetch(`${API_BASE_URL}/Reports/sales?${params}`, { headers: authHeaders })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setErrorMessage(body?.message || 'Não foi possível carregar o relatório.')
        return
      }
      setReport(await res.json())
    } catch {
      setErrorMessage('Não foi possível carregar o relatório.')
    } finally {
      setIsLoading(false)
    }
  }, [authHeaders, startDate, endDate, sellerUid])

  // Chart data: group items by date (day)
  const chartData = useMemo(() => {
    if (!report?.items?.length) return []
    const map = new Map()
    for (const item of report.items) {
      const day = item.saleDate.slice(0, 10)
      const existing = map.get(day) ?? { day, total: 0, qty: 0 }
      existing.total += item.totalAmount
      existing.qty += item.quantity
      map.set(day, existing)
    }
    return Array.from(map.values())
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((d) => ({
        ...d,
        label: new Date(d.day + 'T12:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
      }))
  }, [report])

  function handleExportPdf() {
    if (!report) return
    const sellerName = sellers.find((s) => s.uid === sellerUid)?.name ?? ''
    exportSalesReportPdf(organization, report, { startDate, endDate, sellerName })
  }

  const averageTicket =
    report && report.totalSales > 0 ? report.totalRevenue / report.totalSales : 0

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Relatório de Vendas de Produtos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analise o desempenho de vendas por produto, período e vendedor.
          </p>
        </div>
        {report && (
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Download size={16} />
            Exportar PDF
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Data inicial</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Data final</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Vendedor</span>
            <select
              value={sellerUid}
              onChange={(e) => setSellerUid(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos os vendedores</option>
              {sellers.map((s) => (
                <option key={s.uid} value={s.uid}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={loadReport}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? (
              <Filter size={16} className="animate-pulse" />
            ) : (
              <Search size={16} />
            )}
            {isLoading ? 'Carregando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      {report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <SummaryCard label="Total de Vendas" value={report.totalSales} />
            <SummaryCard label="Peças Vendidas" value={report.totalQuantity} />
            <SummaryCard
              label="Faturamento Bruto"
              value={formatCurrency(report.totalRevenue + report.totalDiscounts)}
            />
            <SummaryCard
              label="Descontos"
              value={formatCurrency(report.totalDiscounts)}
            />
            <SummaryCard
              label="Faturamento Líquido"
              value={formatCurrency(report.totalRevenue)}
              sub={`Ticket médio: ${formatCurrency(averageTicket)}`}
            />
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Faturamento por dia
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat('pt-BR', {
                        notation: 'compact',
                        currency: 'BRL',
                      }).format(v)
                    }
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(v), 'Faturamento']}
                    labelFormatter={(l) => `Dia ${l}`}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill="#2563eb" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {report.items.length} ite{report.items.length !== 1 ? 'ns' : 'm'} vendido
                {report.items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                    <th className="px-4 py-3">Data/Hora</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Cor</th>
                    <th className="px-4 py-3">Tamanho</th>
                    <th className="px-4 py-3">Cód.</th>
                    <th className="px-4 py-3 text-center">Qtde</th>
                    <th className="px-4 py-3 text-right">Vlr. Unit.</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Pagamento</th>
                    <th className="px-4 py-3">Vendedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {report.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-8 text-center text-gray-400 dark:text-gray-500"
                      >
                        Nenhum item encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    report.items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-400">
                          {formatDate(item.saleDate)}
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                          {item.productName}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                          {item.colorName}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                          {item.sizeName}
                        </td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-500">
                          {item.variationCode || '-'}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-900 dark:text-white">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.totalAmount)}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                          {item.customerName}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                          {item.paymentMethodName}
                          {item.installments > 1 && (
                            <span className="ml-1 text-xs text-gray-400">
                              ({item.installments}x)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                          {item.sellerName}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!report && !isLoading && !errorMessage && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-600">
          <Filter size={40} className="mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400">
            Selecione os filtros e clique em <strong>Gerar Relatório</strong>.
          </p>
        </div>
      )}
    </section>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, Filter, TrendingUp } from 'lucide-react'
import { exportCashFlowReportPdf, formatCurrency, formatPercent } from '../utils/pdfExport'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function SummaryCard({ label, value, sub, accent }) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-800 ${accent ? 'border-blue-200 dark:border-blue-700' : 'border-gray-200 dark:border-gray-700'}`}
    >
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${accent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function CashFlowReportPage({ token }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [report, setReport] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const yearOptions = useMemo(() => {
    const years = []
    for (let y = currentYear; y >= currentYear - 4; y--) years.push(y)
    return years
  }, [currentYear])

  useEffect(() => {
    fetch(`${API_BASE_URL}/Organization`, { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setOrganization(data) })
      .catch(() => {})
  }, [authHeaders])

  const loadReport = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch(`${API_BASE_URL}/Reports/cash-flow?year=${year}`, {
        headers: authHeaders,
      })
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
  }, [authHeaders, year])

  // Auto-load on mount
  useEffect(() => {
    loadReport()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Full 12-month chart data (fills missing months with 0)
  const chartData = useMemo(() => {
    if (!report) return []
    const monthMap = new Map((report.months ?? []).map((m) => [m.month, m]))
    return Array.from({ length: 12 }, (_, idx) => {
      const m = monthMap.get(idx + 1)
      return {
        month: MONTH_NAMES[idx],
        gross: m ? Number(m.grossRevenue) : 0,
        discounts: m ? Number(m.totalDiscounts) : 0,
        net: m ? Number(m.netRevenue) : 0,
        sales: m ? m.salesCount : 0,
      }
    })
  }, [report])

  function handleExportPdf() {
    if (!report) return
    exportCashFlowReportPdf(organization, report, year)
  }

  const averageTicket =
    report && report.yearTotalSales > 0 ? report.yearNetRevenue / report.yearTotalSales : 0

  // Best month
  const bestMonth = useMemo(() => {
    if (!report?.months?.length) return null
    return report.months.reduce((best, m) => (m.netRevenue > best.netRevenue ? m : best))
  }, [report])

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fluxo de Caixa Mensal
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Receitas mensais, descontos e ticket médio por ano.
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

      {/* Year filter */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Ano</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
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
          {isLoading ? <Filter size={16} className="animate-pulse" /> : <TrendingUp size={16} />}
          {isLoading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      {report && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <SummaryCard label="Vendas no Ano" value={report.yearTotalSales} />
            <SummaryCard label="Receita Bruta" value={formatCurrency(report.yearGrossRevenue)} />
            <SummaryCard label="Descontos" value={formatCurrency(report.yearTotalDiscounts)} />
            <SummaryCard
              label="Receita Líquida"
              value={formatCurrency(report.yearNetRevenue)}
              accent
            />
            <SummaryCard
              label="Ticket Médio"
              value={formatCurrency(averageTicket)}
              sub={bestMonth ? `Melhor mês: ${MONTH_NAMES[bestMonth.month - 1]}` : undefined}
            />
          </div>

          {/* Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Receita bruta × líquida por mês — {year}
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v)
                  }
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name === 'gross' ? 'Rec. Bruta' : name === 'net' ? 'Rec. Líquida' : 'Descontos',
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === 'gross' ? 'Rec. Bruta' : value === 'net' ? 'Rec. Líquida' : 'Descontos'
                  }
                />
                <Bar dataKey="gross" radius={[3, 3, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill="#bfdbfe" />
                  ))}
                </Bar>
                <Bar dataKey="net" radius={[3, 3, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill="#2563eb" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Detalhamento mensal — {year}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                    <th className="px-4 py-3">Mês</th>
                    <th className="px-4 py-3 text-center">Vendas</th>
                    <th className="px-4 py-3 text-right">Rec. Bruta</th>
                    <th className="px-4 py-3 text-right">Descontos</th>
                    <th className="px-4 py-3 text-right">Rec. Líquida</th>
                    <th className="px-4 py-3 text-right">Ticket Médio</th>
                    <th className="px-4 py-3 text-right">% do Ano</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {MONTH_NAMES.map((name, idx) => {
                    const m = (report.months ?? []).find((x) => x.month === idx + 1)
                    if (!m) {
                      return (
                        <tr key={idx} className="text-gray-400 dark:text-gray-600">
                          <td className="px-4 py-2">{name}</td>
                          <td className="px-4 py-2 text-center">—</td>
                          <td className="px-4 py-2 text-right">—</td>
                          <td className="px-4 py-2 text-right">—</td>
                          <td className="px-4 py-2 text-right">—</td>
                          <td className="px-4 py-2 text-right">—</td>
                          <td className="px-4 py-2 text-right">—</td>
                        </tr>
                      )
                    }
                    const pct =
                      report.yearNetRevenue > 0
                        ? (m.netRevenue / report.yearNetRevenue) * 100
                        : 0
                    const isBest = bestMonth?.month === m.month
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isBest ? 'font-semibold' : ''}`}
                      >
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {name}
                          {isBest && (
                            <span className="ml-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              Melhor
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">
                          {m.salesCount}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                          {formatCurrency(m.grossRevenue)}
                        </td>
                        <td className="px-4 py-2 text-right text-red-500 dark:text-red-400">
                          {m.totalDiscounts > 0 ? `-${formatCurrency(m.totalDiscounts)}` : '—'}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(m.netRevenue)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                          {formatCurrency(m.averageTicket)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-500">
                          {formatPercent(pct)}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Total row */}
                  <tr className="border-t-2 border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50">
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">TOTAL</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">
                      {report.yearTotalSales}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                      {formatCurrency(report.yearGrossRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-500 dark:text-red-400">
                      {report.yearTotalDiscounts > 0
                        ? `-${formatCurrency(report.yearTotalDiscounts)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(report.yearNetRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                      {formatCurrency(averageTicket)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                      100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment method breakdown */}
          {report.paymentBreakdown?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Breakdown por forma de pagamento — {year}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                      <th className="px-4 py-3">Forma de Pagamento</th>
                      <th className="px-4 py-3 text-center">Qtde Vendas</th>
                      <th className="px-4 py-3 text-right">Total Recebido</th>
                      <th className="px-4 py-3 text-right">% do Total</th>
                      <th className="px-4 py-3">Participação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {report.paymentBreakdown.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                          {p.paymentMethodName}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">
                          {p.salesCount}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(p.totalAmount)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                          {formatPercent(p.percentage)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${Math.min(p.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

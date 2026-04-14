import { useCallback, useEffect, useMemo, useState } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Download, Filter, Search } from 'lucide-react'
import { exportAbcReportPdf, formatCurrency, formatPercent } from '../utils/pdfExport'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const ABC_COLORS = { A: '#16a34a', B: '#ca8a04', C: '#dc2626' }
const ABC_BG = { A: 'bg-green-100 text-green-800', B: 'bg-yellow-100 text-yellow-800', C: 'bg-red-100 text-red-800' }
const ABC_DESCRIPTION = {
  A: '20% dos produtos · 80% do faturamento',
  B: '30% dos produtos · 15% do faturamento',
  C: '50% dos produtos · 5% do faturamento',
}

function ClassBadge({ cls }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${ABC_BG[cls] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {cls}
    </span>
  )
}

export default function AbcReportPage({ token }) {
  const [items, setItems] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const today = new Date()
  const firstOfYear = new Date(today.getFullYear(), 0, 1)
  const [startDate, setStartDate] = useState(firstOfYear.toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10))

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

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
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`${API_BASE_URL}/Reports/abc?${params}`, { headers: authHeaders })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setErrorMessage(body?.message || 'Não foi possível carregar o relatório.')
        return
      }
      setItems(await res.json())
    } catch {
      setErrorMessage('Não foi possível carregar o relatório.')
    } finally {
      setIsLoading(false)
    }
  }, [authHeaders, startDate, endDate])

  const stats = useMemo(() => {
    if (!items) return null
    const total = items.reduce((s, i) => s + i.totalRevenue, 0)
    const byClass = { A: { count: 0, revenue: 0 }, B: { count: 0, revenue: 0 }, C: { count: 0, revenue: 0 } }
    for (const item of items) {
      byClass[item.abcClass].count++
      byClass[item.abcClass].revenue += item.totalRevenue
    }
    return { total, byClass }
  }, [items])

  const pieData = useMemo(() => {
    if (!stats) return []
    return ['A', 'B', 'C'].map((cls) => ({
      name: `Classe ${cls}`,
      value: Number(stats.byClass[cls].revenue.toFixed(2)),
    }))
  }, [stats])

  function handleExportPdf() {
    if (!items) return
    exportAbcReportPdf(organization, items, { startDate, endDate })
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Relatório ABC de Produtos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Classifica os produtos por representatividade no faturamento.
          </p>
        </div>
        {items && (
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

      {/* ABC legend */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {['A', 'B', 'C'].map((cls) => (
          <div
            key={cls}
            className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white"
              style={{ backgroundColor: ABC_COLORS[cls] }}
            >
              {cls}
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Classe {cls}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{ABC_DESCRIPTION[cls]}</p>
              {stats && (
                <p className="mt-1 text-xs font-medium" style={{ color: ABC_COLORS[cls] }}>
                  {stats.byClass[cls].count} produto{stats.byClass[cls].count !== 1 ? 's' : ''} ·{' '}
                  {formatCurrency(stats.byClass[cls].revenue)}
                </p>
              )}
            </div>
          </div>
        ))}
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
          <button
            type="button"
            onClick={loadReport}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? <Filter size={16} className="animate-pulse" /> : <Search size={16} />}
            {isLoading ? 'Carregando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      {items && (
        <>
          {/* Chart + Summary */}
          {pieData.some((d) => d.value > 0) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Distribuição do faturamento por classe
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(1)}%)`
                      }
                      labelLine={false}
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={ABC_COLORS[['A', 'B', 'C'][idx]]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Resumo geral
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total de produtos</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Faturamento total</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(stats?.total ?? 0)}
                    </span>
                  </div>
                  {['A', 'B', 'C'].map((cls) => (
                    <div key={cls} className="flex justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
                      <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <ClassBadge cls={cls} />
                        {stats?.byClass[cls].count ?? 0} produto{stats?.byClass[cls].count !== 1 ? 's' : ''}
                      </span>
                      <span className="font-semibold" style={{ color: ABC_COLORS[cls] }}>
                        {formatCurrency(stats?.byClass[cls].revenue ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {items.length} produto{items.length !== 1 ? 's' : ''} analisado{items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                    <th className="px-4 py-3 text-center">#</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3 text-center">Qtde Vendida</th>
                    <th className="px-4 py-3 text-right">Faturamento</th>
                    <th className="px-4 py-3 text-right">% Fat.</th>
                    <th className="px-4 py-3 text-right">% Acumulado</th>
                    <th className="px-4 py-3 text-center">Classe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        Nenhum produto encontrado.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr
                        key={item.rank}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        style={{ borderLeft: `3px solid ${ABC_COLORS[item.abcClass]}` }}
                      >
                        <td className="px-4 py-2 text-center text-gray-500">{item.rank}</td>
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                          {item.productName}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">
                          {item.totalQuantity}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.totalRevenue)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                          {formatPercent(item.revenuePercentage)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                          {formatPercent(item.cumulativePercentage)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <ClassBadge cls={item.abcClass} />
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

      {!items && !isLoading && !errorMessage && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-600">
          <Filter size={40} className="mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400">
            Selecione o período e clique em <strong>Gerar Relatório</strong>.
          </p>
        </div>
      )}
    </section>
  )
}

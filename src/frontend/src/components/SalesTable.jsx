import { recentSales } from '../data/dashboardData'

export default function SalesTable() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Vendas Recentes</h2>
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700"
        >
          Ver Todas
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th className="py-2 pr-3">Venda</th>
              <th className="py-2 pr-3">Cliente</th>
              <th className="py-2 pr-3">Canal</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale) => (
              <tr key={sale.id} className="border-b border-gray-50 last:border-b-0 dark:border-gray-800">
                <td className="py-3 pr-3 font-semibold text-gray-800 dark:text-gray-200">{sale.id}</td>
                <td className="py-3 pr-3 text-gray-700 dark:text-gray-300">{sale.customer}</td>
                <td className="py-3 pr-3 text-gray-700 dark:text-gray-300">{sale.channel}</td>
                <td className="py-3 pr-3 font-semibold text-gray-900 dark:text-gray-100">{sale.total}</td>
                <td className="py-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {sale.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

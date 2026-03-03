import { stockSummary } from '../data/dashboardData'

function StockFlag({ quantity, minimum }) {
  const isLow = quantity < minimum
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isLow
          ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
      }`}
    >
      {isLow ? 'Abaixo do minimo' : 'Estavel'}
    </span>
  )
}

export default function StockTable() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Controle de Estoque</h2>
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700"
        >
          Atualizar
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th className="py-2 pr-3">SKU</th>
              <th className="py-2 pr-3">Produto</th>
              <th className="py-2 pr-3">Qtd</th>
              <th className="py-2 pr-3">Minimo</th>
              <th className="py-2">Situacao</th>
            </tr>
          </thead>
          <tbody>
            {stockSummary.map((item) => (
              <tr key={item.sku} className="border-b border-gray-50 last:border-b-0 dark:border-gray-800">
                <td className="py-3 pr-3 font-semibold text-gray-800 dark:text-gray-200">{item.sku}</td>
                <td className="py-3 pr-3 text-gray-700 dark:text-gray-300">{item.product}</td>
                <td className="py-3 pr-3 font-semibold text-gray-900 dark:text-gray-100">{item.quantity}</td>
                <td className="py-3 pr-3 text-gray-700 dark:text-gray-300">{item.minimum}</td>
                <td className="py-3">
                  <StockFlag quantity={item.quantity} minimum={item.minimum} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

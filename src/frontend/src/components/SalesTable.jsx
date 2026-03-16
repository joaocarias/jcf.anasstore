function formatDateTime(value) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString('pt-BR')
}

export default function SalesTable({ sales, isLoading, onViewAll }) {
  return (
    <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 sm:text-lg">Ultimas vendas</h2>
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700"
          onClick={onViewAll}
        >
          Ver Todas
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th className="py-2 pr-3">Data</th>
              <th className="py-2 pr-3">Cliente</th>
              <th className="py-2 pr-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Carregando vendas...
                </td>
              </tr>
            )}
            {!isLoading &&
              sales?.map((sale) => (
                <tr key={sale.uid} className="border-b border-gray-50 last:border-b-0 dark:border-gray-800">
                  <td className="py-3 pr-3 text-gray-700 dark:text-gray-300">{formatDateTime(sale.createAt)}</td>
                  <td className="py-3 pr-3 font-semibold text-gray-800 dark:text-gray-200">{sale.customerName}</td>
                  <td className="py-3 pr-3 font-semibold text-gray-900 dark:text-gray-100">
                    {Number(sale.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            {!isLoading && (!sales || sales.length === 0) && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma venda encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

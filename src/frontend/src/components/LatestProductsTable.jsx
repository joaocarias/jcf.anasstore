function formatDate(value) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('pt-BR')
}

export default function LatestProductsTable({ products, isLoading, onViewAll }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ultimos produtos cadastrados</h2>
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700"
          onClick={onViewAll}
        >
          Ver Todos
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th className="py-2 pr-3">Produto</th>
              <th className="py-2 pr-3">Estoque</th>
              <th className="py-2 pr-3">Preco</th>
              <th className="py-2">Criado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Carregando produtos...
                </td>
              </tr>
            )}
            {!isLoading &&
              products?.map((product) => (
                <tr key={product.uid} className="border-b border-gray-50 last:border-b-0 dark:border-gray-800">
                  <td className="py-3 pr-3 font-semibold text-gray-800 dark:text-gray-200">{product.name}</td>
                  <td className="py-3 pr-3 text-gray-700 dark:text-gray-300">{product.stockQuantity}</td>
                  <td className="py-3 pr-3 font-semibold text-gray-900 dark:text-gray-100">
                    {Number(product.salePrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="py-3 text-gray-700 dark:text-gray-300">{formatDate(product.createAt)}</td>
                </tr>
              ))}
            {!isLoading && (!products || products.length === 0) && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

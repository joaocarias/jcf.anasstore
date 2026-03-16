import { Boxes, DollarSign, ShoppingCart } from 'lucide-react'

function formatCurrency(value) {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function DashboardCards({ summary, isLoading }) {
  const cards = [
    {
      title: 'Entradas do Dia',
      value: isLoading ? '...' : formatCurrency(summary?.dailyRevenue),
      subtitle: 'Total recebido hoje',
      icon: DollarSign,
    },
    {
      title: 'Vendas do Dia',
      value: isLoading ? '...' : `${summary?.dailySales ?? 0}`,
      subtitle: 'Pedidos fechados hoje',
      icon: ShoppingCart,
    },
    {
      title: 'Itens em Estoque',
      value: isLoading ? '...' : `${summary?.stockItems ?? 0}`,
      subtitle: 'Quantidade total em estoque',
      icon: Boxes,
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article
            key={card.title}
            className="rounded-2xl bg-white p-4 sm:p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30"
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{card.title}</h2>
              <span className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <Icon size={20} />
              </span>
            </div>

            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{card.subtitle}</p>
          </article>
        )
      })}
    </section>
  )
}

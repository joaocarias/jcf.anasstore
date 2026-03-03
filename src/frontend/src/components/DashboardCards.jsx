import { Boxes, DollarSign, ShoppingCart, Wallet } from 'lucide-react'
import { dailySales, monthlyExpenses, monthlyRevenue, stockItems } from '../data/dashboardData'

const cards = [
  {
    title: 'Faturamento do Mes',
    value: monthlyRevenue,
    subtitle: 'Comparativo de receita consolidada',
    icon: DollarSign,
  },
  {
    title: 'Produtos em Estoque',
    value: stockItems,
    subtitle: 'Itens disponiveis no inventario',
    icon: Boxes,
  },
  {
    title: 'Vendas do Dia',
    value: dailySales,
    subtitle: 'Pedidos fechados hoje',
    icon: ShoppingCart,
  },
  {
    title: 'Despesas do Mes',
    value: monthlyExpenses,
    subtitle: 'Custos fixos e variaveis',
    icon: Wallet,
  },
]

export default function DashboardCards() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article
            key={card.title}
            className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30"
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

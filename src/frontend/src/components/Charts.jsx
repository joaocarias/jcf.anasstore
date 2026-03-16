import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { revenueHistory } from '../data/dashboardData'

export default function Charts() {
  return (
    <section className="grid gap-4">
      <article className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">Faturamento Semestral</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueHistory}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ fill: '#1E40AF', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

    </section>
  )
}

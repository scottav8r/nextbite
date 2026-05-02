'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { YearStats } from '@/lib/query/hooks/useStats'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CHART_COLORS = ['#c9a96e', '#8b2635', '#2a2a2a', '#c0526a', '#a8893e', '#5c1a24', '#e8c97a', '#1a1a1a']

interface StatsChartsProps {
  stats: YearStats
}

export function StatsCharts({ stats }: StatsChartsProps) {
  const monthData = stats.memoriesPerMonth.map((m) => ({
    month: MONTH_LABELS[m.month - 1],
    count: m.count,
  }))

  return (
    <div className="space-y-8">
      {/* Memories per month */}
      <section aria-labelledby="monthly-heading">
        <h3 id="monthly-heading" className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-wider mb-3">
          Memories per month
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'currentColor' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'var(--background)', border: '1px solid #ede4d3', borderRadius: 12, fontSize: 12 }}
              cursor={{ fill: 'rgba(201,169,110,0.1)' }}
            />
            <Bar dataKey="count" fill="#c9a96e" radius={[4, 4, 0, 0]} name="Memories" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Cuisine breakdown */}
      {stats.cuisineBreakdown.length > 0 && (
        <section aria-labelledby="cuisine-heading">
          <h3 id="cuisine-heading" className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-wider mb-3">
            By cuisine
          </h3>
          <RankedList items={stats.cuisineBreakdown} total={stats.totalMemories} />
        </section>
      )}

      {/* Tier breakdown */}
      {stats.tierBreakdown.length > 0 && (
        <section aria-labelledby="tier-heading">
          <h3 id="tier-heading" className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-wider mb-3">
            By tier
          </h3>
          <RankedList items={stats.tierBreakdown} total={stats.totalMemories} color="#8b2635" />
        </section>
      )}

      {/* Occasion breakdown */}
      {stats.occasionBreakdown.length > 0 && (
        <section aria-labelledby="occasion-heading">
          <h3 id="occasion-heading" className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-wider mb-3">
            By occasion
          </h3>
          <RankedList items={stats.occasionBreakdown} total={stats.totalMemories} color="#c0526a" />
        </section>
      )}
    </div>
  )
}

function RankedList({
  items,
  total,
  color = '#c9a96e',
}: {
  items: { name: string; count: number }[]
  total: number
  color?: string
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
        return (
          <li key={item.name} className="flex items-center gap-3">
            <span className="text-xs text-charcoal-900 dark:text-cream-50 w-28 truncate shrink-0">
              {item.name}
            </span>
            <div className="flex-1 h-2 rounded-full bg-cream-200 dark:bg-charcoal-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
                aria-label={`${pct}%`}
              />
            </div>
            <span className="text-xs text-charcoal-800/50 dark:text-cream-100/40 w-8 text-right shrink-0">
              {item.count}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

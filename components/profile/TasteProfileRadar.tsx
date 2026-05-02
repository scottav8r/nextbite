'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'
import type { TasteProfile } from '@/lib/types/domain'

interface TasteProfileRadarProps {
  profile: TasteProfile
}

export function TasteProfileRadar({ profile }: TasteProfileRadarProps) {
  // Build radar data from taste profile dimensions
  const data = [
    {
      dimension: 'Cuisine Depth',
      value: Math.min(100, profile.top_cuisines.length * 20),
    },
    {
      dimension: 'Avg Rating',
      value: profile.avg_overall_rating > 0
        ? Math.round((profile.avg_overall_rating / 10) * 100)
        : 0,
    },
    {
      dimension: 'Memories',
      value: Math.min(100, profile.memory_count * 5),
    },
    {
      dimension: 'Occasions',
      value: Math.min(100, profile.top_occasions.length * 25),
    },
    {
      dimension: 'Price Range',
      value: profile.avg_price_level > 0
        ? Math.round((profile.avg_price_level / 4) * 100)
        : 0,
    },
    {
      dimension: 'Tier Variety',
      value: Math.min(100, profile.top_tiers.length * 20),
    },
  ]

  const isEmpty = profile.memory_count === 0

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-48 rounded-2xl border border-cream-200 dark:border-charcoal-800 bg-cream-50 dark:bg-charcoal-900">
        <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40 text-center px-4">
          Log memories to build your Dining Identity
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border border-cream-200 dark:border-charcoal-800 bg-cream-50 dark:bg-charcoal-900 p-4"
      aria-label="Dining Identity radar chart"
    >
      <h3 className="font-serif text-base text-charcoal-900 dark:text-cream-50 mb-1">
        Dining Identity
      </h3>
      <p className="text-xs text-charcoal-800/50 dark:text-cream-100/40 mb-4">
        Based on {profile.memory_count} memor{profile.memory_count === 1 ? 'y' : 'ies'}
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="rgba(42,42,42,0.15)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 10, fill: 'currentColor', className: 'text-charcoal-800/60 dark:text-cream-100/50' }}
          />
          <Radar
            name="Profile"
            dataKey="value"
            stroke="#c9a96e"
            fill="#c9a96e"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Top tags */}
      {profile.top_cuisines.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.top_cuisines.slice(0, 4).map((cuisine) => (
            <span
              key={cuisine}
              className="rounded-full bg-gold-400/20 text-gold-500 dark:text-gold-300 text-[10px] font-medium px-2.5 py-1"
            >
              {cuisine}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

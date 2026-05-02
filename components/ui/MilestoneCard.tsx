'use client'

import { motion } from 'framer-motion'

interface MilestoneCardProps {
  title: string
  description: string
  emoji: string
  onDismiss?: () => void
}

export function MilestoneCard({ title, description, emoji, onDismiss }: MilestoneCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="rounded-2xl bg-charcoal-900 dark:bg-charcoal-800 text-cream-50 p-5 relative overflow-hidden"
    >
      {/* Subtle gold accent */}
      <div aria-hidden="true" className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gold-400/10 -translate-y-8 translate-x-8" />

      <div className="flex items-start gap-4">
        <span className="text-3xl shrink-0" aria-hidden="true">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-base font-medium text-gold-400 mb-1">{title}</p>
          <p className="text-sm text-cream-100/70 leading-relaxed">{description}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss milestone"
            className="shrink-0 text-cream-100/30 hover:text-cream-100/70 transition"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Milestone detection ──────────────────────────────────────────

export interface Milestone {
  id: string
  title: string
  description: string
  emoji: string
}

export function detectMilestones(
  memoryCount: number,
  hasRated10: boolean,
  uniqueCuisineCount: number,
  firstMemoryDate: string | null
): Milestone[] {
  const milestones: Milestone[] = []

  if (memoryCount === 10) {
    milestones.push({
      id: '10th-memory',
      title: 'A Decade of Memories',
      description: 'You\'ve logged your 10th dining memory. Your palate is taking shape.',
      emoji: '✦',
    })
  }

  if (hasRated10) {
    milestones.push({
      id: 'first-10',
      title: 'Perfection Found',
      description: 'You\'ve given a restaurant a perfect 10. A rare and memorable honour.',
      emoji: '⭐',
    })
  }

  if (uniqueCuisineCount >= 5) {
    milestones.push({
      id: '5-cuisines',
      title: 'The Curious Palate',
      description: 'Five different cuisines explored. Your dining world is expanding beautifully.',
      emoji: '🌍',
    })
  }

  if (firstMemoryDate) {
    const firstDate = new Date(firstMemoryDate)
    const now = new Date()
    const yearsSince = (now.getTime() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    if (yearsSince >= 1 && yearsSince < 1.1) {
      milestones.push({
        id: '1-year',
        title: 'One Year of NextBite',
        description: 'A full year of dining memories. What a delicious journey it\'s been.',
        emoji: '🥂',
      })
    }
  }

  return milestones
}

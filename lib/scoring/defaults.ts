/**
 * Context-aware intelligent defaults for the suggestion engine (Req 19.4).
 * Applied when no explicit filters are active.
 */

import type { FilterState, TasteProfile } from '@/lib/types/domain'

export interface SuggestionContext {
  hour: number        // 0–23
  dayOfWeek: number   // 0 = Sunday, 6 = Saturday
  month: number       // 0–11
}

export function buildIntelligentDefaults(
  context: SuggestionContext,
  profile: TasteProfile
): Partial<FilterState> {
  const { hour, dayOfWeek, month } = context
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isLunch = hour >= 11 && hour < 15
  const isEvening = hour >= 17
  const isSummer = month >= 5 && month <= 8

  // Weekday lunch → Quick Lunch, Best Value
  if (!isWeekend && isLunch) {
    return {
      occasions: ['Quick Lunch'],
      price_levels: [1, 2],
    }
  }

  // Weekend evening → Date Night / Special Occasion
  if (isWeekend && isEvening) {
    return {
      occasions: ['Date Night', 'Special Occasion'],
    }
  }

  // Any evening → user's top occasions
  if (isEvening && profile.top_occasions.length > 0) {
    return {
      occasions: profile.top_occasions.slice(0, 2),
    }
  }

  // Summer → prefer outdoor vibe
  if (isSummer) {
    return {
      occasions: profile.top_occasions.slice(0, 1),
    }
  }

  return {}
}

export function getCurrentContext(): SuggestionContext {
  const now = new Date()
  return {
    hour: now.getHours(),
    dayOfWeek: now.getDay(),
    month: now.getMonth(),
  }
}

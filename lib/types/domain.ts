/**
 * Client-side domain types for NextBite.
 * These mirror the Supabase DB schema but are shaped for UI consumption.
 */

export interface Restaurant {
  id: string
  place_id: string | null
  name: string
  address: string | null
  city: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  website_url: string | null
  reservation_url: string | null
  price_level: 1 | 2 | 3 | 4 | null
  google_rating: number | null
  yelp_rating: number | null
  cuisine_tags: string[]
  vibe_tags: string[]
  photos: { url: string; source: 'google' | 'yelp' | 'user' }[]
  opening_hours: Record<string, string[]> | null
  last_synced_at: string
  created_at: string
}

export interface RestaurantSearchResult {
  place_id: string
  name: string
  address: string
  city: string
  lat: number
  lng: number
  price_level: number | null
  rating: number | null
  cuisine_tags: string[]
  photos: { url: string; source: 'google' | 'yelp' }[]
  source: 'google' | 'yelp'
}

export interface Memory {
  id: string
  user_id: string
  restaurant_id: string
  restaurant?: Restaurant
  visit_date: string
  overall_rating: number
  food_rating: number | null
  service_rating: number | null
  ambiance_rating: number | null
  value_rating: number | null
  vibe_rating: number | null
  tiers: string[]
  cuisine_tags: string[]
  vibe_tags: string[]
  occasions: string[]
  approximate_cost: number | null
  narrative_note: string | null
  dishes: Dish[]
  photo_urls: string[]
  visit_number: number
  mood: string | null
  created_at: string
  updated_at: string
}

export interface Dish {
  name: string
  notes: string | null
  photo_url: string | null
}

export interface Wish {
  id: string
  user_id: string
  restaurant_id: string
  restaurant?: Restaurant
  priority: 'low' | 'medium' | 'high'
  notes: string | null
  target_occasion: string | null
  target_date: string | null
  created_at: string
}

export interface FilterPreset {
  id: string
  user_id: string
  name: string
  filters: FilterState
  is_system_default: boolean
  created_at: string
}

export interface FilterState {
  tiers: string[]
  cuisines: string[]
  price_levels: (1 | 2 | 3 | 4)[]
  occasions: string[]
  radius_miles: number
  city: string | null
  include_recent: boolean
}

export interface TasteProfile {
  top_cuisines: string[]
  top_tiers: string[]
  top_occasions: string[]
  avg_price_level: number
  avg_overall_rating: number
  memory_count: number
  personalization_level: 'discovery' | 'early' | 'mature'
}

export interface ScoreBreakdown {
  taste_match: number
  filter_match: number
  wish_bonus: number
  rating_bonus: number
  distance_score: number
  recency_penalty: number
}

export interface ScoredSuggestion {
  restaurant: Restaurant
  match_score: number
  score_breakdown: ScoreBreakdown
  explanation: string
  is_wish: boolean
  wish_priority: 'low' | 'medium' | 'high' | null
  is_sponsored: boolean
  days_since_last_visit: number | null
}

export interface Ad {
  id: string
  title: string
  body: string
  image_url: string
  cta_url: string
  target_cuisines: string[] | null
  target_tiers: string[] | null
  target_occasions: string[] | null
  target_city: string | null
  target_radius_miles: number | null
  is_active: boolean
  starts_at: string
  ends_at: string
}

// ─── Constants ────────────────────────────────────────────────────

export const PRESET_TIERS = [
  'Go-Back Favorite',
  'Hidden Gem',
  'Special Occasion',
  'Best Value',
  'One and Done',
  'Worth the Hype',
  'Underrated',
] as const

export const PRESET_CUISINES = [
  'Italian', 'Japanese', 'Mexican', 'Chinese', 'Indian', 'Thai',
  'French', 'American', 'Mediterranean', 'Korean', 'Vietnamese',
  'Greek', 'Spanish', 'Middle Eastern', 'Ethiopian', 'Fusion',
] as const

export const PRESET_VIBES = [
  'Cozy', 'Lively', 'Romantic', 'Trendy', 'Casual',
  'Upscale', 'Family-Friendly', 'Outdoor', 'Quiet', 'Loud',
] as const

export const OCCASIONS = [
  'Date Night', 'Quick Lunch', 'Family', 'Solo', 'Celebration',
  'Business', 'Casual Hang', 'Special Occasion',
] as const

export const DIETARY_PREFERENCES = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal',
  'Kosher', 'Dairy-Free', 'Nut-Free',
] as const

export function priceLevelLabel(level: number | null): string {
  if (!level) return '—'
  return '$'.repeat(level)
}

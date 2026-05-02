export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string | null
          home_city: string | null
          favorite_cuisines: string[]
          dietary_preferences: string[]
          common_occasions: string[]
          onboarding_completed: boolean
          taste_profile: Json
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          home_city?: string | null
          favorite_cuisines?: string[]
          dietary_preferences?: string[]
          common_occasions?: string[]
          onboarding_completed?: boolean
          taste_profile?: Json
          created_at?: string
        }
        Update: {
          display_name?: string | null
          home_city?: string | null
          favorite_cuisines?: string[]
          dietary_preferences?: string[]
          common_occasions?: string[]
          onboarding_completed?: boolean
          taste_profile?: Json
        }
      }
      restaurants: {
        Row: {
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
          price_level: number | null
          google_rating: number | null
          yelp_rating: number | null
          cuisine_tags: string[]
          vibe_tags: string[]
          photos: Json
          opening_hours: Json | null
          last_synced_at: string
          created_at: string
        }
        Insert: {
          id?: string
          place_id?: string | null
          name: string
          address?: string | null
          city?: string | null
          lat?: number | null
          lng?: number | null
          phone?: string | null
          website_url?: string | null
          reservation_url?: string | null
          price_level?: number | null
          google_rating?: number | null
          yelp_rating?: number | null
          cuisine_tags?: string[]
          vibe_tags?: string[]
          photos?: Json
          opening_hours?: Json | null
          last_synced_at?: string
          created_at?: string
        }
        Update: {
          place_id?: string | null
          name?: string
          address?: string | null
          city?: string | null
          lat?: number | null
          lng?: number | null
          phone?: string | null
          website_url?: string | null
          reservation_url?: string | null
          price_level?: number | null
          google_rating?: number | null
          yelp_rating?: number | null
          cuisine_tags?: string[]
          vibe_tags?: string[]
          photos?: Json
          opening_hours?: Json | null
          last_synced_at?: string
        }
      }
      memories: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
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
          dishes: Json
          photo_urls: string[]
          visit_number: number
          mood: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          visit_date: string
          overall_rating: number
          food_rating?: number | null
          service_rating?: number | null
          ambiance_rating?: number | null
          value_rating?: number | null
          vibe_rating?: number | null
          tiers?: string[]
          cuisine_tags?: string[]
          vibe_tags?: string[]
          occasions?: string[]
          approximate_cost?: number | null
          narrative_note?: string | null
          dishes?: Json
          photo_urls?: string[]
          visit_number?: number
          mood?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          visit_date?: string
          overall_rating?: number
          food_rating?: number | null
          service_rating?: number | null
          ambiance_rating?: number | null
          value_rating?: number | null
          vibe_rating?: number | null
          tiers?: string[]
          cuisine_tags?: string[]
          vibe_tags?: string[]
          occasions?: string[]
          approximate_cost?: number | null
          narrative_note?: string | null
          dishes?: Json
          photo_urls?: string[]
          mood?: string | null
          updated_at?: string
        }
      }
      wishes: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
          priority: 'low' | 'medium' | 'high'
          notes: string | null
          target_occasion: string | null
          target_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          priority?: 'low' | 'medium' | 'high'
          notes?: string | null
          target_occasion?: string | null
          target_date?: string | null
          created_at?: string
        }
        Update: {
          priority?: 'low' | 'medium' | 'high'
          notes?: string | null
          target_occasion?: string | null
          target_date?: string | null
        }
      }
      user_tiers: {
        Row: {
          id: string
          user_id: string
          name: string
          is_preset: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          is_preset?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          is_preset?: boolean
        }
      }
      filter_presets: {
        Row: {
          id: string
          user_id: string
          name: string
          filters: Json
          is_system_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          filters: Json
          is_system_default?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          filters?: Json
          is_system_default?: boolean
        }
      }
      ads: {
        Row: {
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
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          image_url: string
          cta_url: string
          target_cuisines?: string[] | null
          target_tiers?: string[] | null
          target_occasions?: string[] | null
          target_city?: string | null
          target_radius_miles?: number | null
          is_active?: boolean
          starts_at: string
          ends_at: string
          created_at?: string
        }
        Update: {
          title?: string
          body?: string
          image_url?: string
          cta_url?: string
          target_cuisines?: string[] | null
          target_tiers?: string[] | null
          target_occasions?: string[] | null
          target_city?: string | null
          target_radius_miles?: number | null
          is_active?: boolean
          starts_at?: string
          ends_at?: string
        }
      }
      suggestion_logs: {
        Row: {
          id: string
          user_id_hash: string
          filters: Json | null
          result_count: number | null
          latency_ms: number | null
          top_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id_hash: string
          filters?: Json | null
          result_count?: number | null
          latency_ms?: number | null
          top_score?: number | null
          created_at?: string
        }
        Update: never
      }
    }
  }
}

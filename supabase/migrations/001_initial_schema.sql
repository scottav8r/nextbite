-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- for future geospatial queries

-- users: extends auth.users
CREATE TABLE public.users (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name        text,
  home_city           text,
  favorite_cuisines   text[]    DEFAULT '{}',
  dietary_preferences text[]    DEFAULT '{}',
  common_occasions    text[]    DEFAULT '{}',
  onboarding_completed boolean  DEFAULT false,
  taste_profile       jsonb     DEFAULT '{}',
  created_at          timestamptz DEFAULT now()
);

-- restaurants: shared/global, deduplicated by place_id
CREATE TABLE public.restaurants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        text UNIQUE,
  name            text NOT NULL,
  address         text,
  city            text,
  lat             float8,
  lng             float8,
  phone           text,
  website_url     text,
  reservation_url text,
  price_level     int2 CHECK (price_level BETWEEN 1 AND 4),
  google_rating   float4,
  yelp_rating     float4,
  cuisine_tags    text[]  DEFAULT '{}',
  vibe_tags       text[]  DEFAULT '{}',
  photos          jsonb   DEFAULT '[]',
  opening_hours   jsonb,
  last_synced_at  timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

-- memories: user-scoped dining experience records
CREATE TABLE public.memories (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  restaurant_id    uuid NOT NULL REFERENCES public.restaurants(id),
  visit_date       date NOT NULL,
  overall_rating   int2 NOT NULL CHECK (overall_rating BETWEEN 1 AND 10),
  food_rating      int2 CHECK (food_rating BETWEEN 1 AND 10),
  service_rating   int2 CHECK (service_rating BETWEEN 1 AND 10),
  ambiance_rating  int2 CHECK (ambiance_rating BETWEEN 1 AND 10),
  value_rating     int2 CHECK (value_rating BETWEEN 1 AND 10),
  vibe_rating      int2 CHECK (vibe_rating BETWEEN 1 AND 10),
  tiers            text[]  DEFAULT '{}',
  cuisine_tags     text[]  DEFAULT '{}',
  vibe_tags        text[]  DEFAULT '{}',
  occasions        text[]  DEFAULT '{}',
  approximate_cost int4,
  narrative_note   text CHECK (char_length(narrative_note) <= 2000),
  dishes           jsonb   DEFAULT '[]',
  photo_urls       text[]  DEFAULT '{}',
  visit_number     int4    NOT NULL DEFAULT 1,
  mood             text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- wishes: user-scoped restaurant wishlist
CREATE TABLE public.wishes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  restaurant_id    uuid NOT NULL REFERENCES public.restaurants(id),
  priority         text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  notes            text,
  target_occasion  text,
  target_date      date,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (user_id, restaurant_id)
);

-- user_tiers: custom tier labels per user
CREATE TABLE public.user_tiers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  is_preset  boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, name)
);

-- filter_presets: saved filter combinations per user
CREATE TABLE public.filter_presets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name             text NOT NULL,
  filters          jsonb NOT NULL DEFAULT '{}',
  is_system_default boolean DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

-- ads: advertisement records and targeting rules
CREATE TABLE public.ads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  body                text NOT NULL,
  image_url           text NOT NULL,
  cta_url             text NOT NULL,
  target_cuisines     text[],
  target_tiers        text[],
  target_occasions    text[],
  target_city         text,
  target_radius_miles int4,
  is_active           boolean DEFAULT true,
  starts_at           timestamptz NOT NULL,
  ends_at             timestamptz NOT NULL,
  created_at          timestamptz DEFAULT now()
);

-- Auto-update updated_at on memories
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_memories_updated_at
BEFORE UPDATE ON public.memories
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Restaurant lookup
CREATE INDEX idx_restaurants_city ON public.restaurants(city);
CREATE INDEX idx_restaurants_cuisine_tags ON public.restaurants USING GIN(cuisine_tags);
CREATE INDEX idx_restaurants_vibe_tags ON public.restaurants USING GIN(vibe_tags);
CREATE INDEX idx_restaurants_price_level ON public.restaurants(price_level);
CREATE INDEX idx_restaurants_last_synced ON public.restaurants(last_synced_at);

-- Memory queries
CREATE INDEX idx_memories_user_visit_date ON public.memories(user_id, visit_date DESC);
CREATE INDEX idx_memories_restaurant ON public.memories(restaurant_id);
CREATE INDEX idx_memories_user_restaurant ON public.memories(user_id, restaurant_id);
CREATE INDEX idx_memories_tiers ON public.memories USING GIN(tiers);
CREATE INDEX idx_memories_cuisine_tags ON public.memories USING GIN(cuisine_tags);
CREATE INDEX idx_memories_occasions ON public.memories USING GIN(occasions);

-- Wishes queries
CREATE INDEX idx_wishes_user_priority ON public.wishes(user_id, priority);
CREATE INDEX idx_wishes_user_created ON public.wishes(user_id, created_at DESC);

-- User tiers
CREATE INDEX idx_user_tiers_user ON public.user_tiers(user_id);

-- Filter presets
CREATE INDEX idx_filter_presets_user ON public.filter_presets(user_id);

-- Ads targeting
CREATE INDEX idx_ads_active ON public.ads(is_active, starts_at, ends_at);
CREATE INDEX idx_ads_target_city ON public.ads(target_city);

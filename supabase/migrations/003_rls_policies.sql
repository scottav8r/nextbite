-- Enable RLS on all user-scoped tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_presets ENABLE ROW LEVEL SECURITY;

-- restaurants: readable by all authenticated users, no user-scoped writes via RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurants_read_all" ON public.restaurants
  FOR SELECT USING (true);
CREATE POLICY "restaurants_insert_authenticated" ON public.restaurants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "restaurants_update_authenticated" ON public.restaurants
  FOR UPDATE USING (auth.role() = 'authenticated');

-- users: own row only
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- memories: own rows only
CREATE POLICY "memories_select_own" ON public.memories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "memories_insert_own" ON public.memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memories_update_own" ON public.memories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "memories_delete_own" ON public.memories
  FOR DELETE USING (auth.uid() = user_id);

-- wishes: own rows only
CREATE POLICY "wishes_select_own" ON public.wishes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wishes_insert_own" ON public.wishes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishes_update_own" ON public.wishes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wishes_delete_own" ON public.wishes
  FOR DELETE USING (auth.uid() = user_id);

-- user_tiers: own rows only
CREATE POLICY "user_tiers_select_own" ON public.user_tiers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_tiers_insert_own" ON public.user_tiers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_tiers_update_own" ON public.user_tiers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_tiers_delete_own" ON public.user_tiers
  FOR DELETE USING (auth.uid() = user_id);

-- filter_presets: own rows only
CREATE POLICY "filter_presets_select_own" ON public.filter_presets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "filter_presets_insert_own" ON public.filter_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "filter_presets_update_own" ON public.filter_presets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "filter_presets_delete_own" ON public.filter_presets
  FOR DELETE USING (auth.uid() = user_id);

-- ads: readable by all authenticated users (targeting done server-side)
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads_read_active" ON public.ads
  FOR SELECT USING (is_active = true AND starts_at <= now() AND ends_at >= now());

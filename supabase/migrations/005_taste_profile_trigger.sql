-- Function to recompute taste_profile JSONB after every memory write
CREATE OR REPLACE FUNCTION public.update_taste_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_top_cuisines    text[];
  v_top_tiers       text[];
  v_top_occasions   text[];
  v_avg_price       float4;
  v_avg_rating      float4;
  v_memory_count    int4;
BEGIN
  -- Count memories
  SELECT COUNT(*) INTO v_memory_count
  FROM public.memories WHERE user_id = NEW.user_id;

  -- Top cuisines (up to 5, by frequency)
  SELECT array_agg(tag ORDER BY cnt DESC) INTO v_top_cuisines
  FROM (
    SELECT unnest(cuisine_tags) AS tag, COUNT(*) AS cnt
    FROM public.memories
    WHERE user_id = NEW.user_id
    GROUP BY tag
    ORDER BY cnt DESC
    LIMIT 5
  ) sub;

  -- Top tiers (up to 5, by frequency)
  SELECT array_agg(tier ORDER BY cnt DESC) INTO v_top_tiers
  FROM (
    SELECT unnest(tiers) AS tier, COUNT(*) AS cnt
    FROM public.memories
    WHERE user_id = NEW.user_id
    GROUP BY tier
    ORDER BY cnt DESC
    LIMIT 5
  ) sub;

  -- Top occasions (up to 5, by frequency)
  SELECT array_agg(occ ORDER BY cnt DESC) INTO v_top_occasions
  FROM (
    SELECT unnest(occasions) AS occ, COUNT(*) AS cnt
    FROM public.memories
    WHERE user_id = NEW.user_id
    GROUP BY occ
    ORDER BY cnt DESC
    LIMIT 5
  ) sub;

  -- Average price level (via joined restaurants)
  SELECT AVG(r.price_level) INTO v_avg_price
  FROM public.memories m
  JOIN public.restaurants r ON r.id = m.restaurant_id
  WHERE m.user_id = NEW.user_id AND r.price_level IS NOT NULL;

  -- Average overall rating
  SELECT AVG(overall_rating) INTO v_avg_rating
  FROM public.memories WHERE user_id = NEW.user_id;

  -- Update taste_profile on users table
  UPDATE public.users
  SET taste_profile = jsonb_build_object(
    'top_cuisines',       COALESCE(to_jsonb(v_top_cuisines), '[]'::jsonb),
    'top_tiers',          COALESCE(to_jsonb(v_top_tiers), '[]'::jsonb),
    'top_occasions',      COALESCE(to_jsonb(v_top_occasions), '[]'::jsonb),
    'avg_price_level',    COALESCE(v_avg_price, 0),
    'avg_overall_rating', COALESCE(v_avg_rating, 0),
    'memory_count',       v_memory_count
  )
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires after insert or update on memories
CREATE TRIGGER trg_update_taste_profile
AFTER INSERT OR UPDATE ON public.memories
FOR EACH ROW EXECUTE FUNCTION public.update_taste_profile();

-- Also fire on delete to keep count accurate
CREATE OR REPLACE FUNCTION public.update_taste_profile_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Reuse the same logic but with OLD.user_id
  PERFORM public.update_taste_profile_for_user(OLD.user_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for delete trigger
CREATE OR REPLACE FUNCTION public.update_taste_profile_for_user(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_top_cuisines    text[];
  v_top_tiers       text[];
  v_top_occasions   text[];
  v_avg_price       float4;
  v_avg_rating      float4;
  v_memory_count    int4;
BEGIN
  SELECT COUNT(*) INTO v_memory_count
  FROM public.memories WHERE user_id = p_user_id;

  SELECT array_agg(tag ORDER BY cnt DESC) INTO v_top_cuisines
  FROM (
    SELECT unnest(cuisine_tags) AS tag, COUNT(*) AS cnt
    FROM public.memories WHERE user_id = p_user_id
    GROUP BY tag ORDER BY cnt DESC LIMIT 5
  ) sub;

  SELECT array_agg(tier ORDER BY cnt DESC) INTO v_top_tiers
  FROM (
    SELECT unnest(tiers) AS tier, COUNT(*) AS cnt
    FROM public.memories WHERE user_id = p_user_id
    GROUP BY tier ORDER BY cnt DESC LIMIT 5
  ) sub;

  SELECT array_agg(occ ORDER BY cnt DESC) INTO v_top_occasions
  FROM (
    SELECT unnest(occasions) AS occ, COUNT(*) AS cnt
    FROM public.memories WHERE user_id = p_user_id
    GROUP BY occ ORDER BY cnt DESC LIMIT 5
  ) sub;

  SELECT AVG(r.price_level) INTO v_avg_price
  FROM public.memories m
  JOIN public.restaurants r ON r.id = m.restaurant_id
  WHERE m.user_id = p_user_id AND r.price_level IS NOT NULL;

  SELECT AVG(overall_rating) INTO v_avg_rating
  FROM public.memories WHERE user_id = p_user_id;

  UPDATE public.users
  SET taste_profile = jsonb_build_object(
    'top_cuisines',       COALESCE(to_jsonb(v_top_cuisines), '[]'::jsonb),
    'top_tiers',          COALESCE(to_jsonb(v_top_tiers), '[]'::jsonb),
    'top_occasions',      COALESCE(to_jsonb(v_top_occasions), '[]'::jsonb),
    'avg_price_level',    COALESCE(v_avg_price, 0),
    'avg_overall_rating', COALESCE(v_avg_rating, 0),
    'memory_count',       v_memory_count
  )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_taste_profile_delete
AFTER DELETE ON public.memories
FOR EACH ROW EXECUTE FUNCTION public.update_taste_profile_on_delete();
